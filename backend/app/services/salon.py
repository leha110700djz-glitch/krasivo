from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.review import Review
from app.models.salon import Salon
from app.models.master import Master
import uuid


async def recalculate_salon_rating(db: AsyncSession, salon_id: uuid.UUID) -> None:
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.salon_id == salon_id)
    )
    avg_rating, count = result.one()
    salon_result = await db.execute(select(Salon).where(Salon.id == salon_id))
    salon = salon_result.scalar_one_or_none()
    if salon:
        salon.rating = round(float(avg_rating or 0), 2)
        salon.review_count = count or 0


async def recalculate_master_rating(db: AsyncSession, master_id: uuid.UUID) -> None:
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.master_id == master_id)
    )
    avg_rating, count = result.one()
    master_result = await db.execute(select(Master).where(Master.id == master_id))
    master = master_result.scalar_one_or_none()
    if master:
        master.rating = round(float(avg_rating or 0), 2)
        master.review_count = count or 0
