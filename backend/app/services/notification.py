from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
import uuid
from typing import Optional, Dict, Any


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        data=data or {},
    )
    db.add(notification)
    await db.flush()
    return notification


async def send_booking_notification(
    db: AsyncSession,
    booking,
    recipient_id: uuid.UUID,
    event: str,
) -> None:
    messages = {
        "new_booking": {
            "title": "Новая запись",
            "body": f"Поступила новая запись на {booking.date}",
        },
        "booking_confirmed": {
            "title": "Запись подтверждена",
            "body": f"Ваша запись на {booking.date} подтверждена",
        },
        "booking_cancelled": {
            "title": "Запись отменена",
            "body": f"Запись на {booking.date} была отменена",
        },
        "booking_completed": {
            "title": "Запись завершена",
            "body": f"Ваша запись завершена. Оставьте отзыв!",
        },
    }
    msg = messages.get(event, {"title": "Уведомление", "body": "Обновление по вашей записи"})
    await create_notification(
        db=db,
        user_id=recipient_id,
        type=event,
        title=msg["title"],
        body=msg["body"],
        data={"booking_id": str(booking.id)},
    )
