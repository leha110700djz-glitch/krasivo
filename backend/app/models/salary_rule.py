import uuid
import enum
from datetime import datetime
from sqlalchemy import Numeric, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class RuleType(str, enum.Enum):
    fixed = "fixed"
    percent_revenue = "percent_revenue"
    per_booking = "per_booking"


class SalaryRule(Base):
    __tablename__ = "salary_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("salons.id", ondelete="CASCADE"), nullable=False
    )
    rule_type: Mapped[RuleType] = mapped_column(
        SAEnum(RuleType, name="ruletype"), default=RuleType.percent_revenue, nullable=False
    )
    fixed_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    revenue_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), default=40.0, nullable=True)
    per_booking_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    bonus_threshold: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    bonus_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    master = relationship("Master", backref="salary_rule", uselist=False)
    salon = relationship("Salon", backref="salary_rules")
