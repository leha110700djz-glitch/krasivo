import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Float, Integer, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Master(Base):
    __tablename__ = "masters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("salons.id"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    specializations: Mapped[list] = mapped_column(JSONB, default=list, nullable=False, server_default="[]")
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    salon = relationship("Salon", back_populates="masters")
    user = relationship("User", back_populates="master_profile", foreign_keys=[user_id])
    services = relationship("Service", back_populates="master")
    bookings = relationship("Booking", back_populates="master")
    reviews = relationship("Review", back_populates="master")
    schedules = relationship("MasterSchedule", back_populates="master", cascade="all, delete-orphan")
    portfolio = relationship("Portfolio", back_populates="master", cascade="all, delete-orphan")
