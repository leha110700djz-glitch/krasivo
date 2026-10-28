"""
Migration: add revoked_tokens table for JWT refresh-token blacklist.
Run: python migrate_security.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        # Create revoked_tokens table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                jti VARCHAR(36) UNIQUE NOT NULL,
                revoked_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
            );
        """))

        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_revoked_tokens_jti ON revoked_tokens(jti);"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_revoked_tokens_expires_at ON revoked_tokens(expires_at);"
        ))

        # Purge already-expired entries (safe to run on every startup)
        result = await conn.execute(text(
            "DELETE FROM revoked_tokens WHERE expires_at < NOW();"
        ))
        deleted = result.rowcount

        print("Migration completed successfully!")
        print("Created: revoked_tokens table (with indexes on jti and expires_at)")
        if deleted:
            print(f"Cleaned up {deleted} expired token(s)")


if __name__ == "__main__":
    asyncio.run(migrate())
