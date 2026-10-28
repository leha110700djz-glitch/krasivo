import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.schemas.review import ReviewOut, ReviewCreate, ReviewDetail
from app.deps import get_current_active_user
from app.services.salon import recalculate_salon_rating, recalculate_master_rating
from app.services.loyalty import credit_points

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=List[ReviewOut])
async def list_reviews(
    salon_id: Optional[uuid.UUID] = None,
    master_id: Optional[uuid.UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Review)
    if salon_id:
        query = query.where(Review.salon_id == salon_id)
    if master_id:
        query = query.where(Review.master_id == master_id)

    offset = (page - 1) * limit
    query = query.order_by(desc(Review.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return [ReviewOut.model_validate(r) for r in result.scalars().all()]


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    body: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify booking exists and belongs to current user
    booking_res = await db.execute(
        select(Booking).where(
            Booking.id == body.booking_id,
            Booking.client_id == current_user.id,
        )
    )
    booking = booking_res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not yours")

    if booking.status != BookingStatus.completed:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")

    # Check if review already exists
    existing_res = await db.execute(select(Review).where(Review.booking_id == body.booking_id))
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Review already exists for this booking")

    review = Review(
        client_id=current_user.id,
        salon_id=booking.salon_id,
        master_id=booking.master_id,
        booking_id=body.booking_id,
        rating=body.rating,
        text=body.text,
        photos=body.photos,
    )
    db.add(review)
    await db.flush()

    # Recalculate ratings
    await recalculate_salon_rating(db, booking.salon_id)
    if booking.master_id:
        await recalculate_master_rating(db, booking.master_id)

    # Award 50 bonus points for 5-star reviews
    if body.rating == 5:
        await credit_points(db, current_user.id, 50, "review_5star", booking_id=body.booking_id)
    elif body.rating >= 4:
        await credit_points(db, current_user.id, 20, "review_positive", booking_id=body.booking_id)

    await db.refresh(review)
    return ReviewOut.model_validate(review)
