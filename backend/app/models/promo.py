import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, ForeignKey, DateTime, Date, Boolean, Enum as SAEnum, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class DiscountType(str, enum.Enum):
    percent = "percent"
    fixed = "fixed"


class Promo(Base):
    __tablename__ = "promos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_type: Mapped[DiscountType] = mapped_column(SAEnum(DiscountType), nullable=False)
    discount_value: Mapped[int] = mapped_column(Integer, nullable=False)  # percent 0-100 or kopecks
    min_order: Mapped[int] = mapped_column(Integer, default=0)  # minimum booking price in kopecks
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = unlimited
    uses_count: Mapped[int] = mapped_column(Integer, default=0)
    # Scope: null = platform-wide, set = specific salon
    salon_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("salons.id"), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    starts_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    expires_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    salon = relationship("Salon", back_populates="promos")
    usages = relationship("PromoUsage", back_populates="promo")


class PromoUsage(Base):
    __tablename__ = "promo_usages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    promo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("promos.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    booking_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    discount_applied: Mapped[int] = mapped_column(Integer, nullable=False)  # kopecks saved
    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    promo = relationship("Promo", back_populates="usages")
    user = relationship("User")
    booking = relationship("Booking")
