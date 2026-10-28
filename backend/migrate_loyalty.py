"""
Migration: add loyalty_accounts and loyalty_transactions tables.
Run: python migrate_loyalty.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        # Create loyalty_accounts table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS loyalty_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id),
                points INTEGER NOT NULL DEFAULT 0,
                lifetime_points INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_loyalty_accounts_user_id ON loyalty_accounts(user_id);"
        ))

        # Create loyalty_transactions table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS loyalty_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_id UUID NOT NULL REFERENCES loyalty_accounts(id),
                points INTEGER NOT NULL,
                reason VARCHAR(50) NOT NULL,
                booking_id UUID REFERENCES bookings(id),
                description TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_loyalty_transactions_account_id ON loyalty_transactions(account_id);"
        ))

        # Backfill: create loyalty accounts for existing users who don't have one yet
        await conn.execute(text("""
            INSERT INTO loyalty_accounts (user_id, points, lifetime_points)
            SELECT id, 0, 0
            FROM users
            WHERE id NOT IN (SELECT user_id FROM loyalty_accounts)
            ON CONFLICT (user_id) DO NOTHING;
        """))

        print("Migration completed successfully!")
        print("Created: loyalty_accounts, loyalty_transactions tables")
        print("Backfilled: loyalty accounts for all existing users")


if __name__ == "__main__":
    asyncio.run(migrate())
