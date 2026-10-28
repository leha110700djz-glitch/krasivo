import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction


async def credit_points(
    db: AsyncSession,
    user_id: uuid.UUID,
    points: int,
    reason: str,
    booking_id: Optional[int] = None,
    description: Optional[str] = None,
) -> None:
    result = await db.execute(
        select(LoyaltyAccount).where(LoyaltyAccount.user_id == user_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        return  # account may not exist for very old users without migration

    account.points += points
    account.lifetime_points += points

    tx = LoyaltyTransaction(
        account_id=account.id,
        points=points,
        reason=reason,
        booking_id=booking_id,
        description=description or reason,
    )
    db.add(tx)
    await db.flush()
