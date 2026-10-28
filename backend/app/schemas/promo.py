from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
import uuid
from app.models.promo import DiscountType


class PromoOut(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: int
    min_order: int
    max_uses: Optional[int] = None
    uses_count: int
    salon_id: Optional[uuid.UUID] = None
    is_active: bool
    starts_at: Optional[date] = None
    expires_at: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PromoCheck(BaseModel):
    """Response when client checks a promo code"""
    valid: bool
    code: str
    title: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: int
    min_order: int
    # Computed discount for a given price (set if price was provided)
    discount_amount: Optional[int] = None
    final_price: Optional[int] = None
    message: str


class PromoCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: int
    min_order: int = 0
    max_uses: Optional[int] = None
    salon_id: Optional[uuid.UUID] = None
    starts_at: Optional[date] = None
    expires_at: Optional[date] = None

    @field_validator('code')
    @classmethod
    def code_upper(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator('discount_value')
    @classmethod
    def value_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError('discount_value must be positive')
        return v
