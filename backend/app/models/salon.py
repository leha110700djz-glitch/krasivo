import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Float, Integer, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Salon(Base):
    __tablename__ = "salons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    photos: Mapped[list] = mapped_column(JSONB, default=list, nullable=False, server_default="[]")
    categories: Mapped[list] = mapped_column(JSONB, default=list, nullable=False, server_default="[]")
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="salons", foreign_keys=[owner_id])
    masters = relationship("Master", back_populates="salon")
    services = relationship("Service", back_populates="salon")
    bookings = relationship("Booking", back_populates="salon")
    reviews = relationship("Review", back_populates="salon")
    promos = relationship("Promo", back_populates="salon")
