"""
Shifts API — work shift scheduling and salary calculation for masters.
Shift endpoints: owner/admin or the master themselves (GET only).
Salary endpoints: owner/admin only.
"""
import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel as PydanticBase

from app.database import get_db
from app.models.salon import Salon
from app.models.master import Master
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.models.shift import WorkShift
from app.models.salary_rule import SalaryRule, RuleType
from app.deps import get_current_active_user

router = APIRouter(tags=["Shifts & Salary"])


# ── Helpers ────────────────────────────────────────────────────────────────────

async def get_owner_salon(current_user: User, db: AsyncSession) -> Salon:
    result = await db.execute(select(Salon).where(Salon.owner_id == current_user.id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found for this owner.")
    return salon


def require_owner(current_user: User):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Salon owners and admins only")


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class ShiftOut(PydanticBase):
    id: uuid.UUID
    master_id: uuid.UUID
    salon_id: uuid.UUID
    shift_date: date
    start_time: str
    end_time: str
    is_day_off: bool
    note: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_shift(cls, s: WorkShift) -> "ShiftOut":
        return cls(
            id=s.id,
            master_id=s.master_id,
            salon_id=s.salon_id,
            shift_date=s.shift_date,
            start_time=str(s.start_time)[:5],
            end_time=str(s.end_time)[:5],
            is_day_off=s.is_day_off,
            note=s.note,
        )


class ShiftCreate(PydanticBase):
    master_id: uuid.UUID
    shift_date: date
    start_time: str = "10:00"
    end_time: str = "20:00"
    is_day_off: bool = False
    note: Optional[str] = None


class ShiftBatchCreate(PydanticBase):
    master_id: uuid.UUID
    start_date: date
    end_date: date
    weekdays: List[int]  # 0=Mon..6=Sun
    start_time: str = "10:00"
    end_time: str = "20:00"
    is_day_off: bool = False


class SalaryRuleOut(PydanticBase):
    id: uuid.UUID
    master_id: uuid.UUID
    salon_id: uuid.UUID
    rule_type: str
    fixed_amount: Optional[float] = None
    revenue_percent: Optional[float] = None
    per_booking_amount: Optional[float] = None
    bonus_threshold: Optional[float] = None
    bonus_percent: Optional[float] = None
    master_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SalaryRuleCreate(PydanticBase):
    master_id: uuid.UUID
    rule_type: str = "percent_revenue"
    fixed_amount: Optional[float] = None
    revenue_percent: Optional[float] = 40.0
    per_booking_amount: Optional[float] = None
    bonus_threshold: Optional[float] = None
    bonus_percent: Optional[float] = None


class MasterSalaryReport(PydanticBase):
    master_id: str
    master_name: str
    rule_type: str
    base_salary: float
    bonus: float
    total: float
    bookings_count: int
    revenue_generated: float  # in rubles


# ── Shift endpoints ────────────────────────────────────────────────────────────

@router.get("/shifts", response_model=List[ShiftOut])
async def list_shifts(
    master_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    salon_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List shifts. Owner/admin sees all salon shifts; a master sees only their own."""
    is_owner_or_admin = current_user.role in [UserRole.salon_owner, UserRole.admin]

    # Determine which salon to query
    if is_owner_or_admin:
        if salon_id:
            # Admin specifying salon explicitly
            salon = (await db.execute(select(Salon).where(Salon.id == salon_id))).scalar_one_or_none()
            if not salon:
                raise HTTPException(status_code=404, detail="Salon not found")
        else:
            salon = await get_owner_salon(current_user, db)
        target_salon_id = salon.id
    else:
        # Master user: can only view their own shifts
        master_result = await db.execute(
            select(Master).where(Master.user_id == current_user.id, Master.is_active == True)
        )
        master = master_result.scalar_one_or_none()
        if not master:
            raise HTTPException(status_code=403, detail="No master profile found for this user")
        master_id = master.id
        target_salon_id = master.salon_id

    q = select(WorkShift)
    if target_salon_id:
        q = q.where(WorkShift.salon_id == target_salon_id)
    if master_id:
        q = q.where(WorkShift.master_id == master_id)
    if start_date:
        q = q.where(WorkShift.shift_date >= start_date)
    if end_date:
        q = q.where(WorkShift.shift_date <= end_date)
    q = q.order_by(WorkShift.shift_date, WorkShift.start_time)

    result = await db.execute(q)
    shifts = result.scalars().all()
    return [ShiftOut.from_orm_shift(s) for s in shifts]


@router.post("/shifts", response_model=ShiftOut, status_code=status.HTTP_200_OK)
async def upsert_shift(
    body: ShiftCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a shift for a master on a given date (upsert by master_id + shift_date)."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    # Verify master belongs to this salon
    master_result = await db.execute(
        select(Master).where(Master.id == body.master_id, Master.salon_id == salon.id, Master.is_active == True)
    )
    master = master_result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found in your salon")

    # Check for existing shift (upsert)
    existing_result = await db.execute(
        select(WorkShift).where(
            WorkShift.master_id == body.master_id,
            WorkShift.shift_date == body.shift_date,
        )
    )
    shift = existing_result.scalar_one_or_none()

    if shift:
        shift.start_time = body.start_time
        shift.end_time = body.end_time
        shift.is_day_off = body.is_day_off
        shift.note = body.note
    else:
        shift = WorkShift(
            master_id=body.master_id,
            salon_id=salon.id,
            shift_date=body.shift_date,
            start_time=body.start_time,
            end_time=body.end_time,
            is_day_off=body.is_day_off,
            note=body.note,
        )
        db.add(shift)

    await db.flush()
    await db.refresh(shift)
    return ShiftOut.from_orm_shift(shift)


@router.post("/shifts/batch", status_code=status.HTTP_200_OK)
async def batch_create_shifts(
    body: ShiftBatchCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create shifts for all matching weekdays in a date range."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    master_result = await db.execute(
        select(Master).where(Master.id == body.master_id, Master.salon_id == salon.id, Master.is_active == True)
    )
    master = master_result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found in your salon")

    if body.start_date > body.end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date")
    if not body.weekdays:
        raise HTTPException(status_code=400, detail="weekdays list must not be empty")

    created = 0
    updated = 0
    current_date = body.start_date
    while current_date <= body.end_date:
        # weekday(): Mon=0..Sun=6
        if current_date.weekday() in body.weekdays:
            existing_result = await db.execute(
                select(WorkShift).where(
                    WorkShift.master_id == body.master_id,
                    WorkShift.shift_date == current_date,
                )
            )
            shift = existing_result.scalar_one_or_none()
            if shift:
                shift.start_time = body.start_time
                shift.end_time = body.end_time
                shift.is_day_off = body.is_day_off
                updated += 1
            else:
                shift = WorkShift(
                    master_id=body.master_id,
                    salon_id=salon.id,
                    shift_date=current_date,
                    start_time=body.start_time,
                    end_time=body.end_time,
                    is_day_off=body.is_day_off,
                )
                db.add(shift)
                created += 1
        current_date += timedelta(days=1)

    await db.flush()
    return {"created": created, "updated": updated}


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a shift."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    result = await db.execute(
        select(WorkShift).where(WorkShift.id == shift_id, WorkShift.salon_id == salon.id)
    )
    shift = result.scalar_one_or_none()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    await db.delete(shift)
    await db.flush()


# ── Salary endpoints ───────────────────────────────────────────────────────────

@router.get("/salary/rules", response_model=List[SalaryRuleOut])
async def list_salary_rules(
    salon_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List salary rules for the owner's salon."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    result = await db.execute(
        select(SalaryRule)
        .options(selectinload(SalaryRule.master))
        .where(SalaryRule.salon_id == salon.id)
    )
    rules = result.scalars().all()

    out = []
    for rule in rules:
        out.append(SalaryRuleOut(
            id=rule.id,
            master_id=rule.master_id,
            salon_id=rule.salon_id,
            rule_type=rule.rule_type.value if hasattr(rule.rule_type, 'value') else str(rule.rule_type),
            fixed_amount=float(rule.fixed_amount) if rule.fixed_amount is not None else None,
            revenue_percent=float(rule.revenue_percent) if rule.revenue_percent is not None else None,
            per_booking_amount=float(rule.per_booking_amount) if rule.per_booking_amount is not None else None,
            bonus_threshold=float(rule.bonus_threshold) if rule.bonus_threshold is not None else None,
            bonus_percent=float(rule.bonus_percent) if rule.bonus_percent is not None else None,
            master_name=rule.master.name if rule.master else None,
        ))
    return out


@router.post("/salary/rules", response_model=SalaryRuleOut)
async def upsert_salary_rule(
    body: SalaryRuleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a salary rule for a master."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    # Validate master belongs to salon
    master_result = await db.execute(
        select(Master).where(Master.id == body.master_id, Master.salon_id == salon.id, Master.is_active == True)
    )
    master = master_result.scalar_one_or_none()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found in your salon")

    # Validate rule_type
    try:
        rule_type = RuleType(body.rule_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid rule_type: {body.rule_type}")

    existing_result = await db.execute(
        select(SalaryRule).where(SalaryRule.master_id == body.master_id)
    )
    rule = existing_result.scalar_one_or_none()

    if rule:
        rule.rule_type = rule_type
        rule.fixed_amount = body.fixed_amount
        rule.revenue_percent = body.revenue_percent
        rule.per_booking_amount = body.per_booking_amount
        rule.bonus_threshold = body.bonus_threshold
        rule.bonus_percent = body.bonus_percent
    else:
        rule = SalaryRule(
            master_id=body.master_id,
            salon_id=salon.id,
            rule_type=rule_type,
            fixed_amount=body.fixed_amount,
            revenue_percent=body.revenue_percent,
            per_booking_amount=body.per_booking_amount,
            bonus_threshold=body.bonus_threshold,
            bonus_percent=body.bonus_percent,
        )
        db.add(rule)

    await db.flush()
    await db.refresh(rule)

    return SalaryRuleOut(
        id=rule.id,
        master_id=rule.master_id,
        salon_id=rule.salon_id,
        rule_type=rule.rule_type.value if hasattr(rule.rule_type, 'value') else str(rule.rule_type),
        fixed_amount=float(rule.fixed_amount) if rule.fixed_amount is not None else None,
        revenue_percent=float(rule.revenue_percent) if rule.revenue_percent is not None else None,
        per_booking_amount=float(rule.per_booking_amount) if rule.per_booking_amount is not None else None,
        bonus_threshold=float(rule.bonus_threshold) if rule.bonus_threshold is not None else None,
        bonus_percent=float(rule.bonus_percent) if rule.bonus_percent is not None else None,
        master_name=master.name,
    )


@router.get("/salary/report", response_model=List[MasterSalaryReport])
async def salary_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    salon_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate salary for each master in the given date range."""
    require_owner(current_user)
    salon = await get_owner_salon(current_user, db)

    # Get all active masters for the salon
    masters_result = await db.execute(
        select(Master).where(Master.salon_id == salon.id, Master.is_active == True).order_by(Master.name)
    )
    masters = masters_result.scalars().all()

    # Get salary rules for the salon
    rules_result = await db.execute(
        select(SalaryRule).where(SalaryRule.salon_id == salon.id)
    )
    rules_by_master = {str(r.master_id): r for r in rules_result.scalars().all()}

    # Get completed bookings for each master in the date range
    bookings_result = await db.execute(
        select(Booking).where(
            Booking.salon_id == salon.id,
            Booking.status == BookingStatus.completed,
            Booking.date >= start_date,
            Booking.date <= end_date,
        )
    )
    bookings = bookings_result.scalars().all()

    # Group bookings by master
    bookings_by_master: dict[str, list[Booking]] = {}
    for b in bookings:
        key = str(b.master_id)
        if key not in bookings_by_master:
            bookings_by_master[key] = []
        bookings_by_master[key].append(b)

    report = []
    for master in masters:
        master_key = str(master.id)
        master_bookings = bookings_by_master.get(master_key, [])
        rule = rules_by_master.get(master_key)

        bookings_count = len(master_bookings)
        # Booking prices are in kopecks; convert to rubles
        revenue_kopecks = sum(b.price for b in master_bookings)
        revenue_rubles = revenue_kopecks / 100.0

        # Compute base salary
        base_salary = 0.0
        rule_type_str = "percent_revenue"

        if rule is None:
            # Default: 40% of revenue
            base_salary = revenue_rubles * 0.40
            rule_type_str = "percent_revenue"
        else:
            rule_type_str = rule.rule_type.value if hasattr(rule.rule_type, 'value') else str(rule.rule_type)
            if rule.rule_type == RuleType.fixed:
                base_salary = float(rule.fixed_amount or 0)
            elif rule.rule_type == RuleType.percent_revenue:
                pct = float(rule.revenue_percent or 40.0)
                base_salary = revenue_rubles * (pct / 100.0)
            elif rule.rule_type == RuleType.per_booking:
                base_salary = float(rule.per_booking_amount or 0) * bookings_count

        # Compute bonus (applied on revenue exceeding bonus_threshold)
        bonus = 0.0
        if rule and rule.bonus_threshold is not None and rule.bonus_percent is not None:
            threshold = float(rule.bonus_threshold)
            if revenue_rubles > threshold:
                bonus = (revenue_rubles - threshold) * float(rule.bonus_percent) / 100.0

        report.append(MasterSalaryReport(
            master_id=master_key,
            master_name=master.name,
            rule_type=rule_type_str,
            base_salary=round(base_salary, 2),
            bonus=round(bonus, 2),
            total=round(base_salary + bonus, 2),
            bookings_count=bookings_count,
            revenue_generated=round(revenue_rubles, 2),
        ))

    return report
