"""
Migration: create chat_messages and marketing_campaigns tables.
Run: python migrate_messages.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                body TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_messages_salon_users
                ON chat_messages(salon_id, sender_id, recipient_id, sent_at);
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_messages_recipient
                ON chat_messages(recipient_id, is_read);
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS marketing_campaigns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                body TEXT NOT NULL,
                target_segment VARCHAR(20) NOT NULL DEFAULT 'all',
                target_min_visits INTEGER,
                scheduled_at TIMESTAMPTZ,
                sent_at TIMESTAMPTZ,
                status VARCHAR(20) NOT NULL DEFAULT 'draft',
                recipients_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_campaigns_salon
                ON marketing_campaigns(salon_id);
        """))
        print("Migration completed successfully!")
        print("Created: chat_messages, marketing_campaigns tables")


if __name__ == "__main__":
    asyncio.run(migrate())
