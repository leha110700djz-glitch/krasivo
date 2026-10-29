import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class BlacklistedClient(Base):
    __tablename__ = "blacklisted_clients"

    __table_args__ = (
        UniqueConstraint("salon_id", "client_user_id", name="uq_blacklist_salon_user"),
        UniqueConstraint("salon_id", "client_phone", name="uq_blacklist_salon_phone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("salons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    client_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    salon = relationship("Salon", foreign_keys=[salon_id])
    client_user = relationship("User", foreign_keys=[client_user_id])
    added_by = relationship("User", foreign_keys=[added_by_user_id])
