"""
Direct messaging API between salon owners/masters and clients.
Polling-based (no WebSocket). Frontend polls every 10 seconds.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_, and_, desc, case
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.message import ChatMessage
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.deps import get_current_active_user

router = APIRouter(prefix="/messages", tags=["Messages"])


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class MessageSend(BaseModel):
    recipient_id: uuid.UUID
    salon_id: uuid.UUID
    body: str


class UserBrief(BaseModel):
    id: uuid.UUID
    name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    other_user: UserBrief
    salon_id: uuid.UUID
    last_message: str
    unread_count: int
    last_sent_at: datetime


class MessageOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    body: str
    is_read: bool
    sent_at: datetime

    model_config = {"from_attributes": True}


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_salon_for_owner(salon_id: uuid.UUID, owner_id: uuid.UUID, db: AsyncSession) -> Salon:
    """Verify salon exists and belongs to owner."""
    result = await db.execute(
        select(Salon).where(Salon.id == salon_id, Salon.owner_id == owner_id)
    )
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found or access denied")
    return salon


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/unread_count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Total unread messages for the current user."""
    result = await db.execute(
        select(func.count()).where(
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False,
        )
    )
    count = result.scalar_one()
    return {"unread_count": count}


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    salon_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List unique conversations.
    - Owners: pass ?salon_id= to see all client conversations for that salon.
    - Clients (or any user without salon_id): see their own conversations.
    """
    me = current_user.id

    # Build a query that finds distinct conversation partners
    # A conversation partner is defined by (salon_id, other_user_id)
    # We get the last message and unread count per partner.

    # For owner view (salon_id provided and user owns it):
    if salon_id is not None:
        # Verify ownership (or admin)
        if current_user.role in (UserRole.salon_owner, UserRole.admin):
            salon_res = await db.execute(
                select(Salon).where(Salon.id == salon_id)
            )
            salon = salon_res.scalar_one_or_none()
            if not salon:
                raise HTTPException(status_code=404, detail="Salon not found")
            if current_user.role == UserRole.salon_owner and salon.owner_id != me:
                raise HTTPException(status_code=403, detail="Not your salon")
        # Find all messages where salon_id matches and owner is participant
        stmt = select(ChatMessage).where(
            ChatMessage.salon_id == salon_id,
            or_(ChatMessage.sender_id == me, ChatMessage.recipient_id == me),
        ).order_by(desc(ChatMessage.sent_at))
    else:
        # Client/any user: all their conversations regardless of salon
        stmt = select(ChatMessage).where(
            or_(ChatMessage.sender_id == me, ChatMessage.recipient_id == me),
        ).order_by(desc(ChatMessage.sent_at))

    result = await db.execute(stmt)
    all_messages: List[ChatMessage] = list(result.scalars().all())

    # Group by (salon_id, other_user_id) — keep only the latest per pair
    seen: dict[tuple, ConversationOut] = {}
    other_user_ids: set[uuid.UUID] = set()

    for msg in all_messages:
        other_id = msg.recipient_id if msg.sender_id == me else msg.sender_id
        key = (msg.salon_id, other_id)
        if key not in seen:
            seen[key] = {
                "msg": msg,
                "other_id": other_id,
                "unread": 0,
            }
        if msg.recipient_id == me and not msg.is_read:
            seen[key]["unread"] += 1
        other_user_ids.add(other_id)

    # Load user profiles for all partners
    if not other_user_ids:
        return []

    users_res = await db.execute(
        select(User).where(User.id.in_(other_user_ids))
    )
    users_map: dict[uuid.UUID, User] = {u.id: u for u in users_res.scalars().all()}

    conversations: List[ConversationOut] = []
    for (s_id, other_id), data in seen.items():
        other = users_map.get(other_id)
        if not other:
            continue
        conversations.append(ConversationOut(
            other_user=UserBrief(
                id=other.id,
                name=other.name,
                avatar_url=other.avatar_url,
            ),
            salon_id=s_id,
            last_message=data["msg"].body[:120],
            unread_count=data["unread"],
            last_sent_at=data["msg"].sent_at,
        ))

    # Sort by last_sent_at descending
    conversations.sort(key=lambda c: c.last_sent_at, reverse=True)
    return conversations


@router.get("/{other_user_id}", response_model=List[MessageOut])
async def get_message_history(
    other_user_id: uuid.UUID,
    salon_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get message history with a specific user in the context of a salon.
    Marks all received messages as read.
    """
    me = current_user.id

    # Verify the other user exists
    other_res = await db.execute(select(User).where(User.id == other_user_id))
    other_user = other_res.scalar_one_or_none()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch messages in both directions
    stmt = (
        select(ChatMessage)
        .where(
            ChatMessage.salon_id == salon_id,
            or_(
                and_(ChatMessage.sender_id == me, ChatMessage.recipient_id == other_user_id),
                and_(ChatMessage.sender_id == other_user_id, ChatMessage.recipient_id == me),
            ),
        )
        .order_by(ChatMessage.sent_at)
    )
    result = await db.execute(stmt)
    messages: List[ChatMessage] = list(result.scalars().all())

    # Mark received messages as read
    await db.execute(
        update(ChatMessage)
        .where(
            ChatMessage.salon_id == salon_id,
            ChatMessage.sender_id == other_user_id,
            ChatMessage.recipient_id == me,
            ChatMessage.is_read == False,
        )
        .values(is_read=True)
    )

    return [MessageOut.model_validate(m) for m in messages]


@router.post("", response_model=MessageOut, status_code=http_status.HTTP_201_CREATED)
async def send_message(
    body: MessageSend,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to another user within a salon context."""
    if current_user.id == body.recipient_id:
        raise HTTPException(status_code=400, detail="Cannot send a message to yourself")

    # Verify salon exists
    salon_res = await db.execute(select(Salon).where(Salon.id == body.salon_id))
    salon = salon_res.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    # Verify recipient exists
    recipient_res = await db.execute(select(User).where(User.id == body.recipient_id, User.is_active == True))
    recipient = recipient_res.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if not body.body.strip():
        raise HTTPException(status_code=400, detail="Message body cannot be empty")

    msg = ChatMessage(
        salon_id=body.salon_id,
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        body=body.body.strip(),
        is_read=False,
        sent_at=datetime.utcnow(),
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)
