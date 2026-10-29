"""
Migration: add gift_certificates table.
Run: python migrate_certificates.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS gift_certificates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(12) UNIQUE NOT NULL,
                title VARCHAR(200) NOT NULL,
                original_amount NUMERIC(10,2) NOT NULL,
                remaining_amount NUMERIC(10,2) NOT NULL,
                issued_by_salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
                purchased_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                recipient_name VARCHAR(200),
                recipient_email VARCHAR(200),
                message TEXT,
                expires_at TIMESTAMPTZ,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                used_at TIMESTAMPTZ
            );
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_gift_certificates_code ON gift_certificates(code);"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_gift_certificates_salon ON gift_certificates(issued_by_salon_id);"
        ))

        print("Migration completed successfully!")
        print("Created: gift_certificates table")


if __name__ == "__main__":
    asyncio.run(migrate())
