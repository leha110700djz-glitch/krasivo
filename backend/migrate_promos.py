"""
Migration: add promos, promo_usages tables and push_token column to users.
Run: python migrate_promos.py
"""
import asyncio
from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        # Add push_token to users
        await conn.execute(text("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
        """))

        # Create discounttype enum if not exists
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE discounttype AS ENUM ('percent', 'fixed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))

        # Create promos table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS promos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                discount_type discounttype NOT NULL,
                discount_value INTEGER NOT NULL,
                min_order INTEGER NOT NULL DEFAULT 0,
                max_uses INTEGER,
                uses_count INTEGER NOT NULL DEFAULT 0,
                salon_id UUID REFERENCES salons(id),
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                starts_at DATE,
                expires_at DATE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_promos_code ON promos(code);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_promos_salon_id ON promos(salon_id);"))

        # Create promo_usages table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS promo_usages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                promo_id UUID NOT NULL REFERENCES promos(id),
                user_id UUID NOT NULL REFERENCES users(id),
                booking_id UUID REFERENCES bookings(id),
                discount_applied INTEGER NOT NULL,
                used_at TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_promo_usages_promo_id ON promo_usages(promo_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_promo_usages_user_id ON promo_usages(user_id);"))

        # Seed platform-wide promo codes for marketing
        await conn.execute(text("""
            INSERT INTO promos (code, title, description, discount_type, discount_value, min_order, max_uses)
            VALUES
                ('BEAUTY20', 'Скидка 20% на первую запись', 'Только для новых клиентов. Введите код при записи.', 'percent', 20, 0, 1000),
                ('KRASIVO10', 'Скидка 10% для новых клиентов', 'Приветственный бонус от Красиво.', 'percent', 10, 0, NULL),
                ('SUMMER500', 'Летняя скидка 500 ₽', 'При заказе от 2000 ₽. Действует всё лето.', 'fixed', 50000, 200000, 500),
                ('FRIEND15', 'Скидка 15% по реферальной ссылке', 'Поделитесь с другом и получите скидку.', 'percent', 15, 0, NULL)
            ON CONFLICT (code) DO NOTHING;
        """))

        print("Migration completed successfully!")
        print("Created: promos, promo_usages tables")
        print("Added: users.push_token column")
        print("Seeded: 4 platform promo codes (BEAUTY20, KRASIVO10, SUMMER500, FRIEND15)")


if __name__ == "__main__":
    asyncio.run(migrate())
