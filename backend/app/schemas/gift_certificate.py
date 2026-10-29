from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid


class GiftCertificateOut(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    original_amount: Decimal
    remaining_amount: Decimal
    issued_by_salon_id: Optional[uuid.UUID] = None
    purchased_by_user_id: Optional[uuid.UUID] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    message: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GiftCertificateCreate(BaseModel):
    title: str
    amount: Decimal
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    message: Optional[str] = None
    expires_at: Optional[datetime] = None
    # code is auto-generated unless provided
    code: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('amount must be positive')
        return v

    @field_validator('code')
    @classmethod
    def code_upper(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.upper().strip() or None
        return v


class GiftCertificateCheck(BaseModel):
    """Response for public certificate validity check."""
    valid: bool
    code: str
    title: str
    remaining_amount: Optional[Decimal] = None
    expires_at: Optional[datetime] = None
    message: str


class GiftCertificateRedeem(BaseModel):
    code: str
    amount_to_use: Decimal
    booking_id: Optional[uuid.UUID] = None

    @field_validator('amount_to_use')
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('amount_to_use must be positive')
        return v


class GiftCertificateRedeemResult(BaseModel):
    discount_applied: Decimal
    remaining_amount: Decimal
