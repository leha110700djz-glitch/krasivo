import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    client = "client"
    salon_owner = "salon_owner"
    master = "master"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.client, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_token: Mapped[str | None] = mapped_column(Text, nullable=True)  # FCM/APNs token
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    salons = relationship("Salon", back_populates="owner", foreign_keys="Salon.owner_id")
    bookings = relationship("Booking", back_populates="client", foreign_keys="Booking.client_id")
    reviews = relationship("Review", back_populates="client")
    notifications = relationship("Notification", back_populates="user")
    master_profile = relationship("Master", back_populates="user", uselist=False, foreign_keys="Master.user_id")
    loyalty_account = relationship("LoyaltyAccount", back_populates="user", uselist=False)
