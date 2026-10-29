"""
Client blacklist API — owner CRUD.
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.blacklist import BlacklistedClient
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.schemas.blacklist import BlacklistedClientOut, BlacklistAdd
from app.deps import get_current_active_user

router = APIRouter(prefix="/blacklist", tags=["Blacklist"])


async def _get_owner_salon(db: AsyncSession, user: User) -> Salon:
    """Return the salon owned by the user, or raise 403/404."""
    if user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Owners only")
    res = await db.execute(select(Salon).where(Salon.owner_id == user.id))
    salon = res.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon


@router.get("", response_model=List[BlacklistedClientOut])
async def list_blacklist(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner: list blacklisted clients for their salon."""
    salon = await _get_owner_salon(db, current_user)
    result = await db.execute(
        select(BlacklistedClient)
        .where(BlacklistedClient.salon_id == salon.id)
        .order_by(BlacklistedClient.created_at.desc())
    )
    return [BlacklistedClientOut.model_validate(b) for b in result.scalars().all()]


@router.post("", response_model=BlacklistedClientOut, status_code=status.HTTP_201_CREATED)
async def add_to_blacklist(
    body: BlacklistAdd,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner: add a client to the blacklist."""
    if not body.client_user_id and not body.client_phone:
        raise HTTPException(
            status_code=400, detail="Укажите client_user_id или client_phone"
        )

    salon = await _get_owner_salon(db, current_user)

    # Check for duplicates
    if body.client_user_id:
        existing = await db.execute(
            select(BlacklistedClient).where(
                BlacklistedClient.salon_id == salon.id,
                BlacklistedClient.client_user_id == body.client_user_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Клиент уже в чёрном списке")

    if body.client_phone:
        existing = await db.execute(
            select(BlacklistedClient).where(
                BlacklistedClient.salon_id == salon.id,
                BlacklistedClient.client_phone == body.client_phone,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Этот телефон уже в чёрном списке")

    entry = BlacklistedClient(
        salon_id=salon.id,
        client_user_id=body.client_user_id,
        client_phone=body.client_phone,
        client_name=body.client_name,
        reason=body.reason,
        added_by_user_id=current_user.id,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return BlacklistedClientOut.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_blacklist(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner: remove a client from the blacklist."""
    salon = await _get_owner_salon(db, current_user)

    result = await db.execute(
        select(BlacklistedClient).where(BlacklistedClient.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if entry.salon_id != salon.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(entry)
    await db.flush()
