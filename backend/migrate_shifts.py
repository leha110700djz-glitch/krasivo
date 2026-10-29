"""
Migration: add work_shifts and salary_rules tables.
Run: python migrate_shifts.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        # Create work_shifts table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS work_shifts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
                salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
                shift_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_day_off BOOLEAN NOT NULL DEFAULT FALSE,
                note TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(master_id, shift_date)
            );
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_work_shifts_date ON work_shifts(shift_date);"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_work_shifts_master ON work_shifts(master_id);"
        ))

        # Create salary_rules table (with enum type)
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE ruletype AS ENUM ('fixed', 'percent_revenue', 'per_booking');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS salary_rules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                master_id UUID NOT NULL UNIQUE REFERENCES masters(id) ON DELETE CASCADE,
                salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
                rule_type ruletype NOT NULL DEFAULT 'percent_revenue',
                fixed_amount NUMERIC(10,2),
                revenue_percent NUMERIC(5,2) DEFAULT 40.0,
                per_booking_amount NUMERIC(10,2),
                bonus_threshold NUMERIC(10,2),
                bonus_percent NUMERIC(5,2),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))

        print("Migration completed successfully!")
        print("Created: work_shifts, salary_rules tables")


if __name__ == "__main__":
    asyncio.run(migrate())
