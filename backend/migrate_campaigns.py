"""
Migration: alias for migrate_messages.py (both tables already there).
Run: python migrate_campaigns.py
"""
import asyncio
from migrate_messages import migrate

if __name__ == "__main__":
    asyncio.run(migrate())
