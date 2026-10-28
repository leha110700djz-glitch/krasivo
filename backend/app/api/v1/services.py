import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.service import Service, ServiceCategory
from app.models.salon import Salon
from app.models.user import User, UserRole
from app.schemas.service import ServiceOut, ServiceCreate, ServiceUpdate, ServiceCategoryOut
from app.deps import get_current_active_user

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/categories", response_model=List[ServiceCategoryOut])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ServiceCategory).order_by(ServiceCategory.sort_order)
    )
    return [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]


@router.get("", response_model=List[ServiceOut])
async def list_services(
    salon_id: Optional[uuid.UUID] = None,
    master_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Service).options(selectinload(Service.category)).where(Service.is_active == True)
    if salon_id:
        query = query.where(Service.salon_id == salon_id)
    if master_id:
        query = query.where(Service.master_id == master_id)
    if category_id:
        query = query.where(Service.category_id == category_id)

    result = await db.execute(query)
    return [ServiceOut.model_validate(s) for s in result.scalars().all()]


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(
    body: ServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Only salon owners can create services")

    salon_res = await db.execute(select(Salon).where(Salon.id == body.salon_id))
    salon = salon_res.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized for this salon")

    cat_res = await db.execute(select(ServiceCategory).where(ServiceCategory.id == body.category_id))
    if not cat_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")

    service = Service(**body.model_dump())
    db.add(service)
    await db.flush()

    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service.id)
    )
    return ServiceOut.model_validate(result.scalar_one())


@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: uuid.UUID,
    body: ServiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    salon_res = await db.execute(select(Salon).where(Salon.id == service.salon_id))
    salon = salon_res.scalar_one_or_none()
    if not salon or (salon.owner_id != current_user.id and current_user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(service, field, value)

    await db.flush()
    await db.refresh(service)

    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service_id)
    )
    return ServiceOut.model_validate(result.scalar_one())


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    salon_res = await db.execute(select(Salon).where(Salon.id == service.salon_id))
    salon = salon_res.scalar_one_or_none()
    if not salon or (salon.owner_id != current_user.id and current_user.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    service.is_active = False
    await db.flush()
