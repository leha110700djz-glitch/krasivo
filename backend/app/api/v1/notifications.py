import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.schemas.notification import NotificationOut
from app.deps import get_current_active_user, require_role
from app.services.push import send_push

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
async def list_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)

    offset = (page - 1) * limit
    query = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return [NotificationOut.model_validate(n) for n in result.scalars().all()]


@router.put("/read-all", status_code=200)
async def mark_all_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
    return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.flush()
    await db.refresh(notification)
    return NotificationOut.model_validate(notification)


@router.post("/send-test", status_code=200)
async def send_test_push(
    current_user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only: send a test push notification to yourself and save it in DB.
    """
    title = "Тест уведомлений"
    body = "Это тестовое push-уведомление от Красиво"
    delivered = await send_push(
        current_user,
        title=title,
        body=body,
        data={"type": "test"},
    )

    notification = Notification(
        user_id=current_user.id,
        type="test",
        title=title,
        body=body,
        data={"type": "test"},
        sent_at=datetime.utcnow(),
        push_delivered=delivered,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)

    return {
        "message": "Test notification sent",
        "push_delivered": delivered,
        "has_push_token": bool(current_user.push_token),
        "notification_id": str(notification.id),
    }
