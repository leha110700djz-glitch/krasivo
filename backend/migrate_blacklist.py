"""
Migration: add blacklisted_clients table.
Run: python migrate_blacklist.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS blacklisted_clients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
                client_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                client_phone VARCHAR(20),
                client_name VARCHAR(200),
                reason TEXT,
                added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_blacklist_salon ON blacklisted_clients(salon_id);"
        ))
        await conn.execute(text("""
            DO $$ BEGIN
                ALTER TABLE blacklisted_clients
                    ADD CONSTRAINT uq_blacklist_salon_user UNIQUE (salon_id, client_user_id);
            EXCEPTION
                WHEN duplicate_table THEN null;
            END $$;
        """))
        await conn.execute(text("""
            DO $$ BEGIN
                ALTER TABLE blacklisted_clients
                    ADD CONSTRAINT uq_blacklist_salon_phone UNIQUE (salon_id, client_phone);
            EXCEPTION
                WHEN duplicate_table THEN null;
            END $$;
        """))

        print("Migration completed successfully!")
        print("Created: blacklisted_clients table")


if __name__ == "__main__":
    asyncio.run(migrate())
