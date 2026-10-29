"""
Dashboard API — endpoints for salon owners.
All routes require authentication as salon_owner or admin.
"""
import os
import uuid
from datetime import date, timedelta, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload
import aiofiles

from app.database import get_db
from app.models.salon import Salon
from app.models.master import Master
from app.models.service import Service, ServiceCategory
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from pydantic import BaseModel as PydanticBase
from app.schemas.salon import SalonOut, SalonUpdate
from app.schemas.master import MasterOut, MasterCreate, MasterUpdate
from app.schemas.service import ServiceOut, ServiceUpdate
from app.schemas.booking import BookingOut


class DashboardSalonCreate(PydanticBase):
    name: str
    address: str
    city: str
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    categories: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None


class DashboardMasterCreate(PydanticBase):
    name: str
    bio: Optional[str] = None
    specializations: List[str] = []
    experience_years: Optional[int] = None


class DashboardServiceCreate(PydanticBase):
    name: str
    description: Optional[str] = None
    price: int
    duration_minutes: int
    category_id: uuid.UUID
    master_id: Optional[uuid.UUID] = None
from app.deps import get_current_active_user
from app.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def get_owner_salon(current_user: User, db: AsyncSession) -> Salon:
    result = await db.execute(select(Salon).where(Salon.owner_id == current_user.id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found. Please create a salon first.")
    return salon


def require_owner(current_user: User):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Salon owners only")


# ── Salon ─────────────────────────────────────────────────────────────────────

@router.get("/salon", response_model=SalonOut)
async def get_my_salon(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    return SalonOut.model_validate(await get_owner_salon(current_user, db))


@router.post("/salon", response_model=SalonOut, status_code=status.HTTP_201_CREATED)
async def create_my_salon(
    body: DashboardSalonCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    existing = await db.execute(select(Salon).where(Salon.owner_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Salon already exists. Use PUT to update.")
    data = body.model_dump()
    data.setdefault('phone', '')
    salon = Salon(owner_id=current_user.id, **data)
    db.add(salon)
    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.put("/salon", response_model=SalonOut)
async def update_my_salon(
    body: SalonUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(salon, field, value)
    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.post("/salon/photos")
async def upload_salon_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP allowed")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "salons")
    os.makedirs(upload_dir, exist_ok=True)
    ext = (file.filename or "photo.jpg").rsplit(".", 1)[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    url = f"/uploads/salons/{filename}"
    photos = list(salon.photos or [])
    photos.append(url)
    salon.photos = photos
    # Also set as avatar_url if not set
    if not salon.avatar_url:
        salon.avatar_url = url
    await db.flush()
    return {"url": url, "photos": photos}


@router.delete("/salon/photos/{photo_index}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_salon_photo(
    photo_index: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    photos = list(salon.photos or [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=404, detail="Photo not found")
    photos.pop(photo_index)
    salon.photos = photos
    await db.flush()


# ── Masters ───────────────────────────────────────────────────────────────────

@router.get("/masters", response_model=List[MasterOut])
async def get_my_masters(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(
        select(Master).where(Master.salon_id == salon.id, Master.is_active == True)
    )
    return [MasterOut.model_validate(m) for m in result.scalars().all()]


@router.post("/masters", response_model=MasterOut, status_code=status.HTTP_201_CREATED)
async def create_my_master(
    body: DashboardMasterCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    master = Master(salon_id=salon.id, name=body.name, bio=body.bio,
                    specializations=body.specializations or [],
                    experience_years=body.experience_years)
    db.add(master)
    await db.flush()
    await db.refresh(master)
    return MasterOut.model_validate(master)


@router.put("/masters/{master_id}", response_model=MasterOut)
async def update_my_master(
    master_id: uuid.UUID,
    body: MasterUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(select(Master).where(Master.id == master_id, Master.salon_id == salon.id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(master, field, value)
    await db.flush()
    await db.refresh(master)
    return MasterOut.model_validate(master)


@router.delete("/masters/{master_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_master(
    master_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(select(Master).where(Master.id == master_id, Master.salon_id == salon.id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    master.is_active = False
    await db.flush()


@router.post("/masters/{master_id}/avatar")
async def upload_master_avatar(
    master_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(select(Master).where(Master.id == master_id, Master.salon_id == salon.id))
    master = result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP allowed")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    ext = (file.filename or "avatar.jpg").rsplit(".", 1)[-1]
    filename = f"master_{master_id}_{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    url = f"/uploads/avatars/{filename}"
    master.avatar_url = url
    await db.flush()
    return {"url": url}


# ── Services ──────────────────────────────────────────────────────────────────

@router.get("/services", response_model=List[ServiceOut])
async def get_my_services(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(
        select(Service).options(selectinload(Service.category))
        .where(Service.salon_id == salon.id, Service.is_active == True)
        .order_by(Service.name)
    )
    return [ServiceOut.model_validate(s) for s in result.scalars().all()]


@router.post("/services", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_my_service(
    body: DashboardServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    service = Service(
        salon_id=salon.id,
        name=body.name,
        description=body.description,
        duration_minutes=body.duration_minutes,
        price=body.price,
        category_id=body.category_id,
        master_id=body.master_id,
    )
    db.add(service)
    await db.flush()
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service.id)
    )
    return ServiceOut.model_validate(result.scalar_one())


@router.put("/services/{service_id}", response_model=ServiceOut)
async def update_my_service(
    service_id: uuid.UUID,
    body: ServiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(
        select(Service).options(selectinload(Service.category))
        .where(Service.id == service_id, Service.salon_id == salon.id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(service, field, value)
    await db.flush()
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service_id)
    )
    return ServiceOut.model_validate(result.scalar_one())


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_service(
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.salon_id == salon.id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = False
    await db.flush()


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings", response_model=List[BookingOut])
async def get_my_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    per_page: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    query = (
        select(Booking)
        .options(selectinload(Booking.client), selectinload(Booking.master), selectinload(Booking.service))
        .where(Booking.salon_id == salon.id)
        .order_by(desc(Booking.date), desc(Booking.start_time))
    )

    if status_filter:
        try:
            query = query.where(Booking.status == BookingStatus(status_filter))
        except ValueError:
            pass

    if date_from:
        query = query.where(Booking.date >= date_from)
    if date_to:
        query = query.where(Booking.date <= date_to)

    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    result = await db.execute(query)
    bookings = result.scalars().all()

    out = []
    for b in bookings:
        bo = BookingOut.model_validate(b)
        if b.client:
            bo.client_name = b.client.name
            bo.client_phone = b.client.phone
        if b.master:
            bo.master_name = b.master.name
        if b.service:
            bo.service_name = b.service.name
        out.append(bo)

    if search:
        s = search.lower()
        out = [b for b in out if s in (b.client_name or '').lower() or s in (b.master_name or '').lower()]

    return out


# ── Clients ───────────────────────────────────────────────────────────────────

@router.get("/clients")
async def get_my_clients(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    result = await db.execute(
        select(User, func.count(Booking.id).label("bookings_count"),
               func.max(Booking.date).label("last_visit"))
        .join(Booking, Booking.client_id == User.id)
        .where(Booking.salon_id == salon.id)
        .group_by(User.id)
        .order_by(desc(func.max(Booking.date)))
        .limit(200)
    )

    clients = []
    for user, count, last_visit in result.all():
        clients.append({
            "id": str(user.id),
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "bookings_count": count,
            "last_visit": str(last_visit) if last_visit else None,
        })
    return {"items": clients, "total": len(clients)}


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_my_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)
    salon_id = salon.id

    today = date.today()
    month_start = today.replace(day=1)

    # Bookings today
    today_res = await db.execute(
        select(func.count()).select_from(Booking)
        .where(Booking.salon_id == salon_id, Booking.date == today)
    )

    # Revenue this month (completed bookings)
    rev_res = await db.execute(
        select(func.coalesce(func.sum(Booking.price), 0)).select_from(Booking)
        .where(Booking.salon_id == salon_id, Booking.status == BookingStatus.completed,
               Booking.date >= month_start)
    )

    # New clients this month
    new_clients_res = await db.execute(
        select(func.count(func.distinct(Booking.client_id))).select_from(Booking)
        .where(Booking.salon_id == salon_id, Booking.date >= month_start)
    )

    # Bookings + revenue last 7 days (single loop over date objects)
    week_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    bookings_week = []
    revenue_week = []
    for d in week_days:
        count_res = await db.execute(
            select(func.count()).select_from(Booking)
            .where(Booking.salon_id == salon_id, Booking.date == d)
        )
        rev_res2 = await db.execute(
            select(func.coalesce(func.sum(Booking.price), 0)).select_from(Booking)
            .where(Booking.salon_id == salon_id, Booking.status == BookingStatus.completed,
                   Booking.date == d)
        )
        bookings_week.append({"date": str(d), "count": count_res.scalar() or 0})
        revenue_week.append({"date": str(d), "revenue": int(rev_res2.scalar() or 0)})

    return {
        "bookings_today": today_res.scalar() or 0,
        "revenue_month": int(rev_res.scalar() or 0),
        "new_clients": new_clients_res.scalar() or 0,
        "clients_month": new_clients_res.scalar() or 0,
        "avg_rating": float(salon.rating or 0.0),
        "rating": salon.rating,
        "bookings_week": bookings_week,
        "revenue_week": revenue_week,
    }
