import os
import uuid
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload
import aiofiles

from app.database import get_db
from app.models.salon import Salon
from app.models.master import Master
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.models.review import Review
from app.models.user import User, UserRole
from app.schemas.salon import SalonOut, SalonCreate, SalonUpdate, SalonListResponse, SalonDetail, SalonStats
from app.schemas.master import MasterOut
from app.schemas.service import ServiceOut
from app.schemas.review import ReviewDetail
from app.schemas.booking import BookingOut
from app.deps import get_current_active_user, require_salon_owner_or_admin
from app.config import settings

router = APIRouter(prefix="/salons", tags=["Salons"])


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


@router.get("", response_model=SalonListResponse)
async def list_salons(
    city: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = None,
    sort: str = Query("rating", regex="^(rating|distance|new)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Salon).where(Salon.is_active == True)

    if city:
        query = query.where(Salon.city.ilike(f"%{city}%"))
    if category:
        query = query.where(Salon.categories.contains([category]))
    if search:
        query = query.where(
            or_(
                Salon.name.ilike(f"%{search}%"),
                Salon.description.ilike(f"%{search}%"),
                Salon.address.ilike(f"%{search}%"),
            )
        )

    if sort == "rating":
        query = query.order_by(desc(Salon.rating))
    elif sort == "new":
        query = query.order_by(desc(Salon.created_at))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    salons = result.scalars().all()

    # Filter by distance if geo params provided
    if lat is not None and lng is not None and radius is not None:
        filtered = []
        for salon in salons:
            if salon.lat is not None and salon.lng is not None:
                dist = haversine_km(lat, lng, salon.lat, salon.lng)
                if dist <= radius:
                    filtered.append(salon)
        salons = filtered
        total = len(filtered)

    if sort == "distance" and lat is not None and lng is not None:
        salons = sorted(
            salons,
            key=lambda s: haversine_km(lat, lng, s.lat or 0, s.lng or 0) if s.lat else 9999,
        )

    pages = max(1, math.ceil(total / limit))
    return SalonListResponse(
        items=[SalonOut.model_validate(s) for s in salons],
        total=total,
        page=page,
        pages=pages,
    )


@router.get("/{salon_id}", response_model=SalonDetail)
async def get_salon(salon_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    master_count_res = await db.execute(
        select(func.count()).select_from(Master).where(Master.salon_id == salon_id, Master.is_active == True)
    )
    service_count_res = await db.execute(
        select(func.count()).select_from(Service).where(Service.salon_id == salon_id, Service.is_active == True)
    )

    detail = SalonDetail.model_validate(salon)
    detail.master_count = master_count_res.scalar()
    detail.service_count = service_count_res.scalar()
    return detail


@router.post("", response_model=SalonOut, status_code=status.HTTP_201_CREATED)
async def create_salon(
    body: SalonCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Only salon owners can create salons")

    salon = Salon(
        owner_id=current_user.id,
        **body.model_dump(),
    )
    db.add(salon)
    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.put("/{salon_id}", response_model=SalonOut)
async def update_salon(
    salon_id: uuid.UUID,
    body: SalonUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(salon, field, value)

    await db.flush()
    await db.refresh(salon)
    return SalonOut.model_validate(salon)


@router.post("/{salon_id}/photos")
async def upload_salon_photo(
    salon_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "salons")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
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
    await db.flush()

    return {"url": url, "photos": photos}


@router.get("/{salon_id}/masters", response_model=List[MasterOut])
async def get_salon_masters(salon_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Master).where(Master.salon_id == salon_id, Master.is_active == True)
    )
    return [MasterOut.model_validate(m) for m in result.scalars().all()]


@router.get("/{salon_id}/services", response_model=List[ServiceOut])
async def get_salon_services(salon_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category))
        .where(Service.salon_id == salon_id, Service.is_active == True)
    )
    return [ServiceOut.model_validate(s) for s in result.scalars().all()]


@router.get("/{salon_id}/reviews", response_model=List[ReviewDetail])
async def get_salon_reviews(
    salon_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Review, User.name, User.avatar_url)
        .join(User, Review.client_id == User.id)
        .where(Review.salon_id == salon_id)
        .order_by(desc(Review.created_at))
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()
    reviews = []
    for row in rows:
        review, client_name, client_avatar = row
        detail = ReviewDetail.model_validate(review)
        detail.client_name = client_name
        detail.client_avatar = client_avatar
        reviews.append(detail)
    return reviews


@router.get("/{salon_id}/stats", response_model=SalonStats)
async def get_salon_stats(
    salon_id: uuid.UUID,
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    from datetime import date, timedelta
    period_start = date.today() - timedelta(days=period_days)

    total_res = await db.execute(
        select(func.count()).select_from(Booking).where(Booking.salon_id == salon_id)
    )
    completed_res = await db.execute(
        select(func.count()).select_from(Booking).where(
            Booking.salon_id == salon_id, Booking.status == BookingStatus.completed
        )
    )
    cancelled_res = await db.execute(
        select(func.count()).select_from(Booking).where(
            Booking.salon_id == salon_id, Booking.status == BookingStatus.cancelled
        )
    )
    revenue_res = await db.execute(
        select(func.sum(Booking.price)).where(
            Booking.salon_id == salon_id, Booking.status == BookingStatus.completed
        )
    )
    period_revenue_res = await db.execute(
        select(func.sum(Booking.price)).where(
            Booking.salon_id == salon_id,
            Booking.status == BookingStatus.completed,
            Booking.date >= period_start,
        )
    )

    top_services_res = await db.execute(
        select(Service.name, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.salon_id == salon_id)
        .group_by(Service.name)
        .order_by(desc("cnt"))
        .limit(5)
    )

    return SalonStats(
        total_bookings=total_res.scalar() or 0,
        completed_bookings=completed_res.scalar() or 0,
        cancelled_bookings=cancelled_res.scalar() or 0,
        total_revenue=revenue_res.scalar() or 0,
        revenue_period=period_revenue_res.scalar() or 0,
        top_services=[{"name": row[0], "count": row[1]} for row in top_services_res.all()],
        bookings_by_day=[],
    )


@router.get("/{salon_id}/bookings", response_model=List[BookingOut])
async def get_salon_bookings(
    salon_id: uuid.UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if salon.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = select(Booking).where(Booking.salon_id == salon_id)
    if status_filter:
        query = query.where(Booking.status == status_filter)

    offset = (page - 1) * limit
    query = query.order_by(desc(Booking.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return [BookingOut.model_validate(b) for b in result.scalars().all()]
