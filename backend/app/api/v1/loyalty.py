"""
Loyalty system API — points, cashback, leaderboard.
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction
from app.models.user import User, UserRole
from app.schemas.loyalty import (
    LoyaltyAccountOut,
    LoyaltyTransactionOut,
    LoyaltyRedeemRequest,
    LoyaltyEarnRequest,
    LeaderboardEntry,
)
from app.deps import get_current_active_user

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])

# ── Redemption rules ─────────────────────────────────────────────────────────
# 100 points = 50 RUB discount (in kopecks: 5000)
POINTS_TO_KOPECKS = 50  # 1 point = 0.50 RUB → 50 kopecks


async def _get_or_404(account_id: uuid.UUID, db: AsyncSession) -> LoyaltyAccount:
    result = await db.execute(
        select(LoyaltyAccount)
        .where(LoyaltyAccount.id == account_id)
        .options(selectinload(LoyaltyAccount.transactions))
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Loyalty account not found")
    return account


async def _get_account_for_user(user_id: uuid.UUID, db: AsyncSession) -> LoyaltyAccount:
    result = await db.execute(
        select(LoyaltyAccount)
        .where(LoyaltyAccount.user_id == user_id)
        .options(selectinload(LoyaltyAccount.transactions))
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Loyalty account not found")
    return account


# ── GET /loyalty/me ───────────────────────────────────────────────────────────

@router.get("/me", response_model=LoyaltyAccountOut)
async def get_my_loyalty(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return my loyalty balance, level, and last 20 transactions."""
    account = await _get_account_for_user(current_user.id, db)
    return LoyaltyAccountOut.from_account(account)


# ── POST /loyalty/earn ────────────────────────────────────────────────────────

@router.post("/earn", response_model=LoyaltyTransactionOut, status_code=status.HTTP_201_CREATED)
async def earn_points(
    body: LoyaltyEarnRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Internal: credit points to a user. Only owners and admins may call this."""
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Owners and admins only")

    if body.points <= 0:
        raise HTTPException(status_code=400, detail="points must be positive")

    # Resolve target user's loyalty account
    result = await db.execute(
        select(LoyaltyAccount).where(LoyaltyAccount.user_id == body.user_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Loyalty account for user not found")

    account.points += body.points
    account.lifetime_points += body.points

    tx = LoyaltyTransaction(
        account_id=account.id,
        points=body.points,
        reason=body.reason,
        booking_id=body.booking_id,
        description=body.description,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return LoyaltyTransactionOut.model_validate(tx)


# ── POST /loyalty/redeem ──────────────────────────────────────────────────────

@router.post("/redeem", response_model=LoyaltyTransactionOut, status_code=status.HTTP_201_CREATED)
async def redeem_points(
    body: LoyaltyRedeemRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deduct points for a booking discount.
    Rules:
      - Minimum 100 points per redemption.
      - 100 points = 50 ₽ (5000 kopecks) discount.
      - The caller is responsible for ensuring the discount doesn't exceed 50% of the service price.
    """
    account = await _get_account_for_user(current_user.id, db)

    if account.points < body.points:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно баллов. Баланс: {account.points}, запрошено: {body.points}",
        )

    # Deduct
    account.points -= body.points
    discount_rub = (body.points // 100) * 50

    tx = LoyaltyTransaction(
        account_id=account.id,
        points=-body.points,
        reason="promo_redeem",
        booking_id=body.booking_id,
        description=f"Списание {body.points} баллов — скидка {discount_rub} ₽",
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return LoyaltyTransactionOut.model_validate(tx)


# ── GET /loyalty/leaderboard ──────────────────────────────────────────────────

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Public: top-10 users by lifetime points."""
    result = await db.execute(
        select(LoyaltyAccount, User)
        .join(User, LoyaltyAccount.user_id == User.id)
        .where(User.is_active == True)
        .order_by(LoyaltyAccount.lifetime_points.desc())
        .limit(10)
    )
    rows = result.all()

    entries = []
    for account, user in rows:
        from app.schemas.loyalty import _get_level
        entries.append(LeaderboardEntry(
            user_id=user.id,
            user_name=user.name,
            lifetime_points=account.lifetime_points,
            level=_get_level(account.lifetime_points),
        ))
    return entries
