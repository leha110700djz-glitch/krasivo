"""
Migration: add sent_at and push_delivered columns to notifications table.

Run from the backend directory with the venv active:
    python migrate_scheduler.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        # Add sent_at column (nullable datetime)
        await conn.execute(text("""
            ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
        """))

        # Add push_delivered column (boolean, default false)
        await conn.execute(text("""
            ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS push_delivered BOOLEAN NOT NULL DEFAULT FALSE;
        """))

        print("Migration completed successfully!")
        print("Added to notifications: sent_at, push_delivered")


if __name__ == "__main__":
    asyncio.run(migrate())
