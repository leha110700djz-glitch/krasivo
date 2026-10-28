import uuid
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.models.booking import Booking, BookingStatus
from app.schemas.user import UserOut
from app.schemas.salon import SalonOut
from app.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_salons = (await db.execute(select(func.count()).select_from(Salon))).scalar()
    total_bookings = (await db.execute(select(func.count()).select_from(Booking))).scalar()

    revenue_res = await db.execute(
        select(func.sum(Booking.price)).where(Booking.status == BookingStatus.completed)
    )
    total_revenue = revenue_res.scalar() or 0

    new_users_today = (
        await db.execute(
            select(func.count()).select_from(User).where(func.date(User.created_at) == today)
        )
    ).scalar()

    new_bookings_today = (
        await db.execute(
            select(func.count()).select_from(Booking).where(Booking.date == today)
        )
    ).scalar()

    active_salons = (
        await db.execute(
            select(func.count()).select_from(Salon).where(Salon.is_active == True)
        )
    ).scalar()

    return {
        "total_users": total_users,
        "total_salons": total_salons,
        "active_salons": active_salons,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "new_users_today": new_users_today,
        "new_bookings_today": new_bookings_today,
    }


@router.get("/salons", response_model=List[SalonOut])
async def admin_list_salons(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Salon).order_by(desc(Salon.created_at)).offset(offset).limit(limit)
    )
    return [SalonOut.model_validate(s) for s in result.scalars().all()]


@router.put("/salons/{salon_id}/verify", response_model=SalonOut)
async def verify_salon(
    salon_id: uuid.UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    salon.is_verified = True
    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.put("/salons/{salon_id}/block", response_model=SalonOut)
async def block_salon(
    salon_id: uuid.UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    salon.is_active = not salon.is_active
    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.get("/users", response_model=List[UserOut])
async def admin_list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).offset(offset).limit(limit)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]
