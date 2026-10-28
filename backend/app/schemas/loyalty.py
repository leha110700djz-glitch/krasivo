from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import uuid


def _get_level(lifetime_points: int) -> str:
    if lifetime_points >= 5000:
        return "platinum"
    elif lifetime_points >= 2000:
        return "gold"
    elif lifetime_points >= 500:
        return "silver"
    return "bronze"


def _get_next_level_threshold(lifetime_points: int) -> Optional[int]:
    if lifetime_points >= 5000:
        return None  # already at max level
    elif lifetime_points >= 2000:
        return 5000
    elif lifetime_points >= 500:
        return 2000
    return 500


class LoyaltyTransactionOut(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    points: int
    reason: str
    booking_id: Optional[uuid.UUID] = None
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoyaltyAccountOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    points: int
    lifetime_points: int
    level: str
    next_level_threshold: Optional[int] = None
    transactions: List[LoyaltyTransactionOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_account(cls, account) -> "LoyaltyAccountOut":
        level = _get_level(account.lifetime_points)
        next_threshold = _get_next_level_threshold(account.lifetime_points)
        transactions = sorted(account.transactions, key=lambda t: t.created_at, reverse=True)[:20]
        return cls(
            id=account.id,
            user_id=account.user_id,
            points=account.points,
            lifetime_points=account.lifetime_points,
            level=level,
            next_level_threshold=next_threshold,
            transactions=[LoyaltyTransactionOut.model_validate(t) for t in transactions],
            created_at=account.created_at,
            updated_at=account.updated_at,
        )


class LoyaltyRedeemRequest(BaseModel):
    points: int
    booking_id: uuid.UUID

    @field_validator("points")
    @classmethod
    def points_min(cls, v: int) -> int:
        if v < 100:
            raise ValueError("Минимум 100 баллов для списания")
        if v % 100 != 0:
            raise ValueError("Количество баллов должно быть кратно 100")
        return v


class LoyaltyEarnRequest(BaseModel):
    user_id: uuid.UUID
    points: int
    reason: str
    booking_id: Optional[uuid.UUID] = None
    description: str


class LeaderboardEntry(BaseModel):
    user_id: uuid.UUID
    user_name: str
    lifetime_points: int
    level: str

    model_config = {"from_attributes": True}
