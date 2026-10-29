"""
Segmented marketing campaigns API.
Owners can create, list, send and delete push notification campaigns.
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.campaign import MarketingCampaign, CampaignSegment, CampaignStatus
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.deps import get_current_active_user, require_role
from app.services.push import send_push_to_many

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    salon_id: uuid.UUID
    title: str
    body: str
    target_segment: str = "all"
    target_min_visits: Optional[int] = None
    scheduled_at: Optional[datetime] = None

    @field_validator("target_segment")
    @classmethod
    def validate_segment(cls, v: str) -> str:
        valid = {e.value for e in CampaignSegment}
        if v not in valid:
            raise ValueError(f"target_segment must be one of: {', '.join(sorted(valid))}")
        return v

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if len(v) > 1000:
            raise ValueError("body must be at most 1000 characters")
        return v


class CampaignOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    title: str
    body: str
    target_segment: str
    target_min_visits: Optional[int]
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    status: str
    recipients_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Segment logic ───────────────────────────────────────────────────────────

async def _get_segment_users(
    salon_id: uuid.UUID,
    segment: str,
    target_min_visits: Optional[int],
    db: AsyncSession,
) -> List[User]:
    """
    Return the list of users that match the given segment for a salon.
    """
    now = datetime.utcnow()
    DAY = timedelta(days=1)

    # Sub-query: count bookings and last booking date per client for this salon
    # We only count completed or confirmed bookings to avoid noise
    valid_statuses = [BookingStatus.completed, BookingStatus.confirmed]

    # Base: all clients with at least 1 booking
    bookings_stmt = (
        select(
            Booking.client_id,
            func.count(Booking.id).label("visit_count"),
            func.max(Booking.date).label("last_visit"),
        )
        .where(
            Booking.salon_id == salon_id,
            Booking.status.in_(valid_statuses),
        )
        .group_by(Booking.client_id)
        .subquery()
    )

    stmt = select(User).join(bookings_stmt, User.id == bookings_stmt.c.client_id)

    if segment == CampaignSegment.all:
        # All clients with >= 1 booking
        pass

    elif segment == CampaignSegment.new:
        stmt = stmt.where(bookings_stmt.c.visit_count == 1)

    elif segment == CampaignSegment.returning:
        stmt = stmt.where(
            and_(
                bookings_stmt.c.visit_count >= 2,
                bookings_stmt.c.visit_count <= 5,
            )
        )

    elif segment == CampaignSegment.loyal:
        stmt = stmt.where(bookings_stmt.c.visit_count >= 6)

    elif segment == CampaignSegment.sleeping:
        cutoff = (now - timedelta(days=60)).date()
        stmt = stmt.where(bookings_stmt.c.last_visit < cutoff)

    elif segment == CampaignSegment.lost:
        cutoff = (now - timedelta(days=180)).date()
        stmt = stmt.where(bookings_stmt.c.last_visit < cutoff)

    # Apply custom min visits filter if provided
    if target_min_visits is not None:
        stmt = stmt.where(bookings_stmt.c.visit_count >= target_min_visits)

    result = await db.execute(stmt)
    return list(result.scalars().all())


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_owned_salon(salon_id: uuid.UUID, current_user: User, db: AsyncSession) -> Salon:
    q = select(Salon).where(Salon.id == salon_id)
    if current_user.role == UserRole.salon_owner:
        q = q.where(Salon.owner_id == current_user.id)
    result = await db.execute(q)
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found or access denied")
    return salon


async def _get_campaign(
    campaign_id: uuid.UUID, current_user: User, db: AsyncSession
) -> MarketingCampaign:
    result = await db.execute(
        select(MarketingCampaign).where(MarketingCampaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # Verify ownership via salon
    await _get_owned_salon(campaign.salon_id, current_user, db)
    return campaign


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CampaignOut])
async def list_campaigns(
    salon_id: uuid.UUID = Query(...),
    current_user: User = Depends(require_role(UserRole.salon_owner, UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """List all campaigns for a salon."""
    await _get_owned_salon(salon_id, current_user, db)
    result = await db.execute(
        select(MarketingCampaign)
        .where(MarketingCampaign.salon_id == salon_id)
        .order_by(desc(MarketingCampaign.created_at))
    )
    return [CampaignOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=CampaignOut, status_code=http_status.HTTP_201_CREATED)
async def create_campaign(
    body: CampaignCreate,
    current_user: User = Depends(require_role(UserRole.salon_owner, UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """Create a campaign in draft or scheduled status."""
    await _get_owned_salon(body.salon_id, current_user, db)

    status = CampaignStatus.draft.value
    if body.scheduled_at is not None:
        if body.scheduled_at <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="scheduled_at must be in the future")
        status = CampaignStatus.scheduled.value

    campaign = MarketingCampaign(
        salon_id=body.salon_id,
        title=body.title.strip(),
        body=body.body.strip(),
        target_segment=body.target_segment,
        target_min_visits=body.target_min_visits,
        scheduled_at=body.scheduled_at,
        status=status,
        recipients_count=0,
        created_at=datetime.utcnow(),
    )
    db.add(campaign)
    await db.flush()
    await db.refresh(campaign)
    return CampaignOut.model_validate(campaign)


@router.post("/{campaign_id}/send", response_model=CampaignOut)
async def send_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.salon_owner, UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """
    Immediately send a campaign to the target segment.
    Determines recipients, fires push notifications, updates status.
    """
    campaign = await _get_campaign(campaign_id, current_user, db)

    if campaign.status == CampaignStatus.sent.value:
        raise HTTPException(status_code=400, detail="Campaign already sent")
    if campaign.status == CampaignStatus.cancelled.value:
        raise HTTPException(status_code=400, detail="Campaign is cancelled")

    # Resolve target users
    users = await _get_segment_users(
        salon_id=campaign.salon_id,
        segment=campaign.target_segment,
        target_min_visits=campaign.target_min_visits,
        db=db,
    )

    # Send push notifications
    delivered = await send_push_to_many(
        users=users,
        title=campaign.title,
        body=campaign.body,
        data={
            "type": "marketing_campaign",
            "campaign_id": str(campaign.id),
            "salon_id": str(campaign.salon_id),
        },
    )

    # Update campaign record
    campaign.status = CampaignStatus.sent.value
    campaign.sent_at = datetime.utcnow()
    campaign.recipients_count = delivered

    await db.flush()
    await db.refresh(campaign)
    return CampaignOut.model_validate(campaign)


@router.delete("/{campaign_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.salon_owner, UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """Delete a draft or cancel a scheduled campaign."""
    campaign = await _get_campaign(campaign_id, current_user, db)

    if campaign.status == CampaignStatus.sent.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a sent campaign. Consider keeping it for analytics.",
        )

    if campaign.status == CampaignStatus.scheduled.value:
        # Cancel instead of hard-delete to preserve the record
        campaign.status = CampaignStatus.cancelled.value
        await db.flush()
    else:
        await db.delete(campaign)
        await db.flush()
