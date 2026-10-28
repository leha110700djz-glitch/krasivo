import os
import uuid
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import aiofiles

from app.database import get_db
from app.models.master import Master
from app.models.schedule import MasterSchedule
from app.models.portfolio import Portfolio
from app.models.salon import Salon
from app.models.user import User, UserRole
from app.schemas.master import MasterOut, MasterCreate, MasterUpdate, ScheduleOut, ScheduleUpdate, TimeSlot, PortfolioItem
from app.deps import get_current_active_user
from app.services.booking import get_available_slots
from app.config import settings

router = APIRouter(prefix="/masters", tags=["Masters"])


@router.get("", response_model=List[MasterOut])
async def list_masters(
    salon_id: Optional[uuid.UUID] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Master).where(Master.is_active == True)
    if salon_id:
        query = query.where(Master.salon_id == salon_id)
    if city:
        query = query.join(Salon, Master.salon_id == Salon.id).where(Salon.city.ilike(f"%{city}%"))

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return [MasterOut.model_validate(m) for m in result.scalars().all()]


@router.get("/{master_id}", response_model=MasterOut)
async def get_master(master_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return MasterOut.model_validate(master)


@router.post("", response_model=MasterOut, status_code=status.HTTP_201_CREATED)
async def create_master(
    body: MasterCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Only salon owners can create masters")

    if body.salon_id:
        salon_res = await db.execute(select(Salon).where(Salon.id == body.salon_id))
        salon = salon_res.scalar_one_or_none()
        if not salon:
            raise HTTPException(status_code=404, detail="Salon not found")
        if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Not authorized to add masters to this salon")

    master = Master(**body.model_dump())
    db.add(master)
    await db.flush()
    await db.refresh(master)
    return MasterOut.model_validate(master)


@router.put("/{master_id}", response_model=MasterOut)
async def update_master(
    master_id: uuid.UUID,
    body: MasterUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    # Check authorization
    can_edit = current_user.role == UserRole.admin
    if master.user_id == current_user.id:
        can_edit = True
    if master.salon_id:
        salon_res = await db.execute(select(Salon).where(Salon.id == master.salon_id))
        salon = salon_res.scalar_one_or_none()
        if salon and salon.owner_id == current_user.id:
            can_edit = True

    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(master, field, value)

    await db.flush()
    await db.refresh(master)
    return MasterOut.model_validate(master)


@router.get("/{master_id}/slots", response_model=List[TimeSlot])
async def get_master_slots(
    master_id: uuid.UUID,
    target_date: date = Query(..., alias="date"),
    service_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    duration = 60  # default
    if service_id:
        from app.models.service import Service
        svc_res = await db.execute(select(Service).where(Service.id == service_id))
        svc = svc_res.scalar_one_or_none()
        if svc:
            duration = svc.duration_minutes

    slots = await get_available_slots(db, master_id, target_date, duration)
    return slots


@router.get("/{master_id}/schedule", response_model=List[ScheduleOut])
async def get_master_schedule(master_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MasterSchedule).where(MasterSchedule.master_id == master_id).order_by(MasterSchedule.day_of_week)
    )
    return [ScheduleOut.model_validate(s) for s in result.scalars().all()]


@router.put("/{master_id}/schedule", response_model=List[ScheduleOut])
async def update_master_schedule(
    master_id: uuid.UUID,
    body: ScheduleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    can_edit = current_user.role == UserRole.admin or master.user_id == current_user.id
    if master.salon_id and not can_edit:
        salon_res = await db.execute(select(Salon).where(Salon.id == master.salon_id))
        salon = salon_res.scalar_one_or_none()
        if salon and salon.owner_id == current_user.id:
            can_edit = True

    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete existing schedule
    await db.execute(delete(MasterSchedule).where(MasterSchedule.master_id == master_id))

    new_schedules = []
    for item in body.schedule:
        s = MasterSchedule(
            master_id=master_id,
            day_of_week=item.day_of_week,
            start_time=item.start_time,
            end_time=item.end_time,
            is_working=item.is_working,
        )
        db.add(s)
        new_schedules.append(s)

    await db.flush()
    for s in new_schedules:
        await db.refresh(s)

    return [ScheduleOut.model_validate(s) for s in new_schedules]


@router.get("/{master_id}/portfolio", response_model=List[PortfolioItem])
async def get_master_portfolio(master_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Portfolio).where(Portfolio.master_id == master_id)
    )
    return [PortfolioItem.model_validate(p) for p in result.scalars().all()]


@router.post("/{master_id}/portfolio", response_model=PortfolioItem)
async def add_portfolio_item(
    master_id: uuid.UUID,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    can_edit = current_user.role == UserRole.admin or master.user_id == current_user.id
    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized")

    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "portfolios")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    item = Portfolio(
        master_id=master_id,
        image_url=f"/uploads/portfolios/{filename}",
        description=description,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return PortfolioItem.model_validate(item)


@router.delete("/{master_id}/portfolio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_item(
    master_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    can_edit = current_user.role == UserRole.admin or master.user_id == current_user.id
    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized")

    item_res = await db.execute(
        select(Portfolio).where(Portfolio.id == item_id, Portfolio.master_id == master_id)
    )
    item = item_res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    await db.delete(item)
    await db.flush()
