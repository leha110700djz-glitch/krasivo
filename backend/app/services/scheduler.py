"""
APScheduler background tasks for the Красиво platform.

All tasks are wrapped in try/except — a failing task logs an error but
never crashes the server. Sessions are opened and closed inside each task
using AsyncSessionLocal directly (no request context).
"""

import logging
from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import and_, select, text

from app.database import AsyncSessionLocal
from app.models.booking import Booking, BookingStatus
from app.models.master import Master
from app.models.notification import Notification
from app.models.review import Review
from app.models.salon import Salon
from app.models.user import User
from app.services.push import send_push

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_user(db, user_id) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _get_master(db, master_id) -> Master | None:
    result = await db.execute(select(Master).where(Master.id == master_id))
    return result.scalar_one_or_none()


async def _get_salon(db, salon_id) -> Salon | None:
    result = await db.execute(select(Salon).where(Salon.id == salon_id))
    return result.scalar_one_or_none()


async def _already_notified(db, user_id, notif_type: str, booking_id) -> bool:
    """Return True if a notification of this type was already sent for this booking."""
    result = await db.execute(
        select(Notification.id).where(
            and_(
                Notification.user_id == user_id,
                Notification.type == notif_type,
                Notification.data["booking_id"].astext == str(booking_id),
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def _create_db_notification(
    db,
    user_id,
    notif_type: str,
    title: str,
    body: str,
    data: dict,
    push_delivered: bool,
) -> None:
    n = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        data=data,
        sent_at=datetime.utcnow(),
        push_delivered=push_delivered,
    )
    db.add(n)
    await db.flush()


# ---------------------------------------------------------------------------
# Task: tomorrow's booking reminders (every 30 min)
# ---------------------------------------------------------------------------

@scheduler.scheduled_job("interval", minutes=30, id="send_booking_reminders")
async def send_booking_reminders() -> None:
    """Remind clients and salon owners about confirmed bookings tomorrow."""
    logger.info("[SCHEDULER] send_booking_reminders: start")
    tomorrow = date.today() + timedelta(days=1)

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.date == tomorrow,
                        Booking.status == BookingStatus.confirmed,
                    )
                )
            )
            bookings = result.scalars().all()
            logger.info(
                "[SCHEDULER] send_booking_reminders: %d bookings for %s",
                len(bookings),
                tomorrow,
            )

            for booking in bookings:
                client = await _get_user(db, booking.client_id)
                master = await _get_master(db, booking.master_id)
                salon = await _get_salon(db, booking.salon_id)

                master_name = master.name if master else "мастером"
                time_str = (
                    booking.start_time.strftime("%H:%M") if booking.start_time else "?"
                )
                notif_data = {"booking_id": str(booking.id)}

                # --- client reminder ---
                if client and not await _already_notified(
                    db, client.id, "booking_reminder", booking.id
                ):
                    title = "Напоминание о записи"
                    body = f"Напоминание: запись к {master_name} завтра в {time_str}"
                    delivered = await send_push(
                        client, title=title, body=body, data={**notif_data, "type": "booking_reminder"}
                    )
                    await _create_db_notification(
                        db, client.id, "booking_reminder", title, body, notif_data, delivered
                    )

                # --- owner reminder ---
                if salon:
                    owner = await _get_user(db, salon.owner_id)
                    if owner and not await _already_notified(
                        db, owner.id, "booking_reminder_owner", booking.id
                    ):
                        client_name = client.name if client else "Клиент"
                        title = "Запись завтра"
                        body = f"Запись {client_name} завтра в {time_str}"
                        delivered = await send_push(
                            owner, title=title, body=body, data={**notif_data, "type": "booking_reminder_owner"}
                        )
                        await _create_db_notification(
                            db, owner.id, "booking_reminder_owner", title, body, notif_data, delivered
                        )

            await db.commit()
        except Exception:
            logger.exception("[SCHEDULER] send_booking_reminders error")
            await db.rollback()


# ---------------------------------------------------------------------------
# Task: 1-hour reminders (every 15 min)
# ---------------------------------------------------------------------------

@scheduler.scheduled_job("interval", minutes=15, id="send_1hour_reminders")
async def send_1hour_reminders() -> None:
    """Remind clients about bookings starting within the next hour."""
    logger.info("[SCHEDULER] send_1hour_reminders: start")
    today = date.today()
    now = datetime.utcnow()
    in_1h = now + timedelta(hours=1)

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.date == today,
                        Booking.status == BookingStatus.confirmed,
                        Booking.start_time >= now.time(),
                        Booking.start_time <= in_1h.time(),
                    )
                )
            )
            bookings = result.scalars().all()
            logger.info(
                "[SCHEDULER] send_1hour_reminders: %d bookings in next hour", len(bookings)
            )

            for booking in bookings:
                client = await _get_user(db, booking.client_id)
                if not client:
                    continue

                if await _already_notified(db, client.id, "booking_1h_reminder", booking.id):
                    continue

                master = await _get_master(db, booking.master_id)
                master_name = master.name if master else "мастером"
                time_str = (
                    booking.start_time.strftime("%H:%M") if booking.start_time else "?"
                )

                title = "Скоро запись!"
                body = f"Напоминание: запись к {master_name} сегодня в {time_str}"
                notif_data = {"booking_id": str(booking.id)}

                delivered = await send_push(
                    client, title=title, body=body, data={**notif_data, "type": "booking_1h_reminder"}
                )
                await _create_db_notification(
                    db, client.id, "booking_1h_reminder", title, body, notif_data, delivered
                )

            await db.commit()
        except Exception:
            logger.exception("[SCHEDULER] send_1hour_reminders error")
            await db.rollback()


# ---------------------------------------------------------------------------
# Task: request reviews after visit (every hour)
# ---------------------------------------------------------------------------

@scheduler.scheduled_job("interval", hours=1, id="request_reviews_after_visit")
async def request_reviews_after_visit() -> None:
    """Ask clients to leave a review for completed visits from yesterday."""
    logger.info("[SCHEDULER] request_reviews_after_visit: start")
    yesterday = date.today() - timedelta(days=1)

    async with AsyncSessionLocal() as db:
        try:
            # Completed bookings from yesterday that have no review yet
            result = await db.execute(
                select(Booking)
                .outerjoin(Review, Review.booking_id == Booking.id)
                .where(
                    and_(
                        Booking.date == yesterday,
                        Booking.status == BookingStatus.completed,
                        Review.id.is_(None),
                    )
                )
            )
            bookings = result.scalars().all()
            logger.info(
                "[SCHEDULER] request_reviews_after_visit: %d bookings to request", len(bookings)
            )

            for booking in bookings:
                client = await _get_user(db, booking.client_id)
                if not client:
                    continue

                if await _already_notified(db, client.id, "review_request", booking.id):
                    continue

                title = "Как прошла запись?"
                body = "Как прошла запись? Оставьте отзыв"
                notif_data = {
                    "booking_id": str(booking.id),
                    "salon_id": str(booking.salon_id),
                }

                delivered = await send_push(
                    client, title=title, body=body, data={**notif_data, "type": "review_request"}
                )
                await _create_db_notification(
                    db, client.id, "review_request", title, body, notif_data, delivered
                )

            await db.commit()
        except Exception:
            logger.exception("[SCHEDULER] request_reviews_after_visit error")
            await db.rollback()


# ---------------------------------------------------------------------------
# Task: cleanup expired revoked tokens (daily at 03:00 UTC)
# ---------------------------------------------------------------------------

@scheduler.scheduled_job("cron", hour=3, minute=0, id="cleanup_expired_tokens")
async def cleanup_expired_tokens() -> None:
    """Delete expired rows from revoked_tokens table."""
    logger.info("[SCHEDULER] cleanup_expired_tokens: start")

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                text("DELETE FROM revoked_tokens WHERE expires_at < NOW()")
            )
            await db.commit()
            logger.info(
                "[SCHEDULER] cleanup_expired_tokens: deleted %d rows",
                result.rowcount,
            )
        except Exception as exc:
            # Table may not exist yet — log and continue.
            logger.warning(
                "[SCHEDULER] cleanup_expired_tokens error (table may not exist): %s", exc
            )
            await db.rollback()
