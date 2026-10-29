import uuid
from datetime import datetime, date, time
from sqlalchemy import Boolean, DateTime, Date, Time, ForeignKey, func, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class WorkShift(Base):
    __tablename__ = "work_shifts"
    __table_args__ = (
        UniqueConstraint("master_id", "shift_date", name="uq_work_shifts_master_date"),
        Index("ix_work_shifts_date", "shift_date"),
        Index("ix_work_shifts_master", "master_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("salons.id", ondelete="CASCADE"), nullable=False
    )
    shift_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_day_off: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    master = relationship("Master", backref="work_shifts")
    salon = relationship("Salon", backref="work_shifts")
