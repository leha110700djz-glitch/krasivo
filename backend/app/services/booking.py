from datetime import date, time, datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.booking import Booking, BookingStatus
from app.models.schedule import MasterSchedule
import uuid


def time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def minutes_to_time(minutes: int) -> time:
    return time(hour=minutes // 60, minute=minutes % 60)


async def get_available_slots(
    db: AsyncSession,
    master_id: uuid.UUID,
    target_date: date,
    duration_minutes: int,
) -> List[dict]:
    # Get day of week (0=Mon..6=Sun)
    day_of_week = target_date.weekday()

    # Get master schedule for that day
    schedule_result = await db.execute(
        select(MasterSchedule).where(
            and_(
                MasterSchedule.master_id == master_id,
                MasterSchedule.day_of_week == day_of_week,
                MasterSchedule.is_working == True,
            )
        )
    )
    schedule = schedule_result.scalar_one_or_none()

    if not schedule:
        return []

    # Get existing bookings for that day
    bookings_result = await db.execute(
        select(Booking).where(
            and_(
                Booking.master_id == master_id,
                Booking.date == target_date,
                Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
            )
        )
    )
    existing_bookings = bookings_result.scalars().all()

    # Build occupied intervals
    occupied = []
    for b in existing_bookings:
        occupied.append((time_to_minutes(b.start_time), time_to_minutes(b.end_time)))

    # Generate slots every 30 minutes
    slot_step = 30
    start_min = time_to_minutes(schedule.start_time)
    end_min = time_to_minutes(schedule.end_time)

    slots = []
    current = start_min
    now = datetime.now()

    while current + duration_minutes <= end_min:
        slot_start = current
        slot_end = current + duration_minutes

        # Check if slot overlaps with any booking
        available = True
        for occ_start, occ_end in occupied:
            if slot_start < occ_end and slot_end > occ_start:
                available = False
                break

        # Check if slot is in the past
        slot_dt = datetime.combine(target_date, minutes_to_time(slot_start))
        if slot_dt <= now:
            available = False

        slots.append({
            "start_time": minutes_to_time(slot_start).strftime("%H:%M"),
            "end_time": minutes_to_time(slot_end).strftime("%H:%M"),
            "available": available,
        })
        current += slot_step

    return slots


async def check_slot_available(
    db: AsyncSession,
    master_id: uuid.UUID,
    target_date: date,
    start_time: time,
    end_time: time,
) -> bool:
    # Check schedule
    day_of_week = target_date.weekday()
    schedule_result = await db.execute(
        select(MasterSchedule).where(
            and_(
                MasterSchedule.master_id == master_id,
                MasterSchedule.day_of_week == day_of_week,
                MasterSchedule.is_working == True,
            )
        )
    )
    schedule = schedule_result.scalar_one_or_none()
    if not schedule:
        return False

    if start_time < schedule.start_time or end_time > schedule.end_time:
        return False

    # Check for conflicting bookings
    bookings_result = await db.execute(
        select(Booking).where(
            and_(
                Booking.master_id == master_id,
                Booking.date == target_date,
                Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
                Booking.start_time < end_time,
                Booking.end_time > start_time,
            )
        )
    )
    conflict = bookings_result.scalar_one_or_none()
    return conflict is None
