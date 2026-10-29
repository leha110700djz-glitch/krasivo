import uuid
from datetime import datetime, timedelta, time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.models.master import Master
from app.models.salon import Salon
from app.models.user import User, UserRole
from app.models.blacklist import BlacklistedClient
from app.schemas.booking import BookingOut, BookingCreate, BookingDetail, CancelBookingRequest
from app.deps import get_current_active_user
from app.services.booking import check_slot_available
from app.services.notification import send_booking_notification
from app.services.loyalty import credit_points
from app.limiter import limiter, get_user_key

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def add_minutes_to_time(t: time, minutes: int) -> time:
    dt = datetime.combine(datetime.today(), t) + timedelta(minutes=minutes)
    return dt.time()


@router.get("", response_model=List[BookingOut])
async def list_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).where(Booking.client_id == current_user.id)
    if status_filter:
        query = query.where(Booking.status == status_filter)

    offset = (page - 1) * limit
    query = query.order_by(desc(Booking.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return [BookingOut.model_validate(b) for b in result.scalars().all()]


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute", key_func=get_user_key)
async def create_booking(
    request: Request,
    body: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Get service
    svc_res = await db.execute(select(Service).where(Service.id == body.service_id, Service.is_active == True))
    service = svc_res.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Check blacklist: block if this user is blacklisted at the salon
    from sqlalchemy import or_ as _or
    bl_query = select(BlacklistedClient).where(
        BlacklistedClient.salon_id == service.salon_id,
        _or(
            BlacklistedClient.client_user_id == current_user.id,
            BlacklistedClient.client_phone == current_user.phone,
        ),
    )
    bl_res = await db.execute(bl_query)
    if bl_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Вы не можете записаться в этот салон")

    # Get master
    master_res = await db.execute(select(Master).where(Master.id == body.master_id, Master.is_active == True))
    master = master_res.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    end_time = add_minutes_to_time(body.start_time, service.duration_minutes)

    # Check availability — raises 409 if master already has a booking in this slot
    available = await check_slot_available(db, body.master_id, body.date, body.start_time, end_time)
    if not available:
        raise HTTPException(status_code=409, detail="Это время уже занято, выберите другой слот")

    booking = Booking(
        client_id=current_user.id,
        salon_id=service.salon_id,
        master_id=body.master_id,
        service_id=body.service_id,
        date=body.date,
        start_time=body.start_time,
        end_time=end_time,
        price=service.price,
        status=BookingStatus.pending,
        notes=body.notes,
    )
    db.add(booking)
    await db.flush()
    await db.refresh(booking)

    # Notify salon owner
    salon_res = await db.execute(select(Salon).where(Salon.id == service.salon_id))
    salon = salon_res.scalar_one_or_none()
    if salon:
        await send_booking_notification(db, booking, salon.owner_id, "new_booking")

    return BookingOut.model_validate(booking)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check access
    if booking.client_id != current_user.id and current_user.role not in [UserRole.admin, UserRole.salon_owner, UserRole.master]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return BookingOut.model_validate(booking)


@router.put("/{booking_id}/confirm", response_model=BookingOut)
async def confirm_booking(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending bookings can be confirmed")

    # Check authorization: must be salon owner or admin
    salon_res = await db.execute(select(Salon).where(Salon.id == booking.salon_id))
    salon = salon_res.scalar_one_or_none()

    is_authorized = (
        current_user.role == UserRole.admin
        or (salon and salon.owner_id == current_user.id)
    )
    if not is_authorized:
        # Check if current user is the master
        master_res = await db.execute(select(Master).where(Master.id == booking.master_id))
        master = master_res.scalar_one_or_none()
        if master and master.user_id == current_user.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = BookingStatus.confirmed
    await db.flush()
    await send_booking_notification(db, booking, booking.client_id, "booking_confirmed")
    await db.refresh(booking)
    return BookingOut.model_validate(booking)


@router.put("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: uuid.UUID,
    body: CancelBookingRequest = CancelBookingRequest(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status in [BookingStatus.completed, BookingStatus.cancelled]:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or already cancelled booking")

    if booking.client_id != current_user.id and current_user.role not in [UserRole.admin, UserRole.salon_owner]:
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = BookingStatus.cancelled
    booking.cancel_reason = body.reason
    await db.flush()

    # Notify both parties
    if booking.client_id != current_user.id:
        await send_booking_notification(db, booking, booking.client_id, "booking_cancelled")

    salon_res = await db.execute(select(Salon).where(Salon.id == booking.salon_id))
    salon = salon_res.scalar_one_or_none()
    if salon and salon.owner_id != current_user.id:
        await send_booking_notification(db, booking, salon.owner_id, "booking_cancelled")

    await db.refresh(booking)
    return BookingOut.model_validate(booking)


@router.put("/{booking_id}/complete", response_model=BookingOut)
async def complete_booking(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.confirmed:
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be completed")

    salon_res = await db.execute(select(Salon).where(Salon.id == booking.salon_id))
    salon = salon_res.scalar_one_or_none()

    is_authorized = current_user.role == UserRole.admin or (salon and salon.owner_id == current_user.id)
    if not is_authorized:
        master_res = await db.execute(select(Master).where(Master.id == booking.master_id))
        master = master_res.scalar_one_or_none()
        if master and master.user_id == current_user.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = BookingStatus.completed
    await db.flush()
    await send_booking_notification(db, booking, booking.client_id, "booking_completed")
    await credit_points(db, booking.client_id, 20, "booking_completed", booking_id=booking.id)
    await db.refresh(booking)
    return BookingOut.model_validate(booking)
