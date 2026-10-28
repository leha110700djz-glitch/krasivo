"""
Seed script for Krasivo beauty salon booking platform.
Idempotent: checks for existing data before inserting.
Run: python seed.py
"""
import asyncio
import uuid
from datetime import date, time, timedelta, datetime
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.config import settings
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.models.master import Master
from app.models.service import Service, ServiceCategory
from app.models.schedule import MasterSchedule
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.services.auth import hash_password

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CATEGORIES = [
    {"name": "Волосы", "icon": "scissors", "sort_order": 1},
    {"name": "Ногти", "icon": "nail-polish", "sort_order": 2},
    {"name": "Брови/Ресницы", "icon": "eye", "sort_order": 3},
    {"name": "Макияж", "icon": "lipstick", "sort_order": 4},
    {"name": "Массаж", "icon": "hand-heart", "sort_order": 5},
    {"name": "Барбер", "icon": "razor", "sort_order": 6},
    {"name": "Уход за кожей", "icon": "leaf", "sort_order": 7},
]

SALONS_DATA = [
    # Москва
    {
        "name": "Студия красоты BLOOM",
        "description": "Премиальная студия красоты в центре Москвы. Работаем с 2015 года. Лучшие мастера, авторские техники.",
        "address": "ул. Арбат, 12",
        "city": "Москва",
        "lat": 55.7494, "lng": 37.5922,
        "phone": "+74951234567",
        "website": "https://bloom-beauty.ru",
        "categories": ["Волосы", "Ногти", "Макияж"],
        "avatar_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format",
    },
    {
        "name": "Барбершоп Brothers",
        "description": "Мужская парикмахерская с классическим подходом. Стрижки, бритьё, уход за бородой.",
        "address": "Тверская ул., 8",
        "city": "Москва",
        "lat": 55.7636, "lng": 37.6010,
        "phone": "+74952345678",
        "categories": ["Барбер"],
        "avatar_url": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format",
    },
    {
        "name": "SPA & Beauty Club Harmony",
        "description": "Полный спектр услуг красоты и здоровья. Массаж, уход за кожей, маникюр.",
        "address": "Ленинский проспект, 34",
        "city": "Москва",
        "lat": 55.7177, "lng": 37.5697,
        "phone": "+74953456789",
        "categories": ["Массаж", "Уход за кожей", "Ногти"],
        "avatar_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&auto=format",
    },
    {
        "name": "Лаборатория красоты GLAM",
        "description": "Инновационные техники окрашивания и ухода за волосами. Только органические средства.",
        "address": "Новый Арбат, 21",
        "city": "Москва",
        "lat": 55.7520, "lng": 37.5849,
        "phone": "+74954567890",
        "categories": ["Волосы"],
        "avatar_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format",
    },
    # Санкт-Петербург
    {
        "name": "Beauty House Nevsky",
        "description": "Уютный салон красоты на Невском проспекте. Макияж, брови, укладки для особых случаев.",
        "address": "Невский проспект, 45",
        "city": "Санкт-Петербург",
        "lat": 59.9325, "lng": 30.3367,
        "phone": "+78121234567",
        "categories": ["Волосы", "Брови/Ресницы", "Макияж"],
        "avatar_url": "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80&auto=format",
    },
    {
        "name": "Nail Studio Petersburg",
        "description": "Специализированная студия маникюра и педикюра. Гель-лак, акрил, арт-дизайн.",
        "address": "Каменноостровский проспект, 12",
        "city": "Санкт-Петербург",
        "lat": 59.9628, "lng": 30.3116,
        "phone": "+78122345678",
        "categories": ["Ногти"],
        "avatar_url": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&auto=format",
    },
    {
        "name": "Barbershop Питер",
        "description": "Классический барбершоп с атмосферой старого Петербурга. Виски, джаз и безупречный стиль.",
        "address": "Большой проспект П.С., 7",
        "city": "Санкт-Петербург",
        "lat": 59.9551, "lng": 30.3045,
        "phone": "+78123456789",
        "categories": ["Барбер"],
        "avatar_url": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&auto=format",
    },
    # Екатеринбург
    {
        "name": "Студия The Look",
        "description": "Современная студия красоты в Екатеринбурге. Полный уход, от стрижки до ногтей.",
        "address": "ул. Ленина, 56",
        "city": "Екатеринбург",
        "lat": 56.8356, "lng": 60.6147,
        "phone": "+73431234567",
        "categories": ["Волосы", "Ногти", "Уход за кожей"],
        "avatar_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&auto=format",
    },
    {
        "name": "Beauty Lab Ekb",
        "description": "Лаборатория красоты с авторскими техниками. Брови, ресницы, перманентный макияж.",
        "address": "ул. Малышева, 89",
        "city": "Екатеринбург",
        "lat": 56.8272, "lng": 60.6022,
        "phone": "+73432345678",
        "categories": ["Брови/Ресницы", "Макияж"],
        "avatar_url": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80&auto=format",
    },
    {
        "name": "Мужской клуб Урал",
        "description": "Барбершоп для настоящих мужчин Урала. Стрижки, бритьё, горячее полотенце.",
        "address": "ул. 8 Марта, 14",
        "city": "Екатеринбург",
        "lat": 56.8394, "lng": 60.6180,
        "phone": "+73433456789",
        "categories": ["Барбер"],
        "avatar_url": "https://images.unsplash.com/photo-1508109742-0ccab98b9ea4?w=800&q=80&auto=format",
    },
]

MASTERS_DATA = [
    {"name": "Анна Петрова", "specializations": ["Волосы", "Окрашивание"], "experience_years": 7},
    {"name": "Мария Иванова", "specializations": ["Ногти", "Маникюр", "Педикюр"], "experience_years": 5},
    {"name": "Елена Сидорова", "specializations": ["Брови", "Ресницы"], "experience_years": 4},
    {"name": "Дмитрий Козлов", "specializations": ["Барбер", "Стрижки"], "experience_years": 6},
    {"name": "Ольга Новикова", "specializations": ["Макияж", "Уход за кожей"], "experience_years": 8},
    {"name": "Сергей Морозов", "specializations": ["Барбер", "Бритьё"], "experience_years": 9},
    {"name": "Татьяна Волкова", "specializations": ["Массаж", "СПА"], "experience_years": 10},
    {"name": "Алексей Зайцев", "specializations": ["Волосы", "Стрижки"], "experience_years": 3},
    {"name": "Наталья Попова", "specializations": ["Ногти", "Гель-лак"], "experience_years": 6},
    {"name": "Ирина Лебедева", "specializations": ["Брови", "Татуаж"], "experience_years": 7},
]

SERVICES_TEMPLATES = {
    "Волосы": [
        ("Женская стрижка", 350000, 60),
        ("Мужская стрижка", 180000, 45),
        ("Окрашивание волос", 700000, 120),
        ("Укладка", 250000, 45),
        ("Кератиновое выпрямление", 900000, 180),
    ],
    "Ногти": [
        ("Маникюр классический", 150000, 60),
        ("Маникюр с гель-лаком", 250000, 90),
        ("Педикюр классический", 200000, 60),
        ("Наращивание ногтей", 450000, 120),
        ("Парафинотерапия рук", 180000, 45),
    ],
    "Брови/Ресницы": [
        ("Коррекция бровей", 120000, 30),
        ("Окрашивание бровей", 150000, 45),
        ("Наращивание ресниц", 350000, 90),
        ("Ламинирование ресниц", 300000, 60),
        ("Татуаж бровей", 800000, 120),
    ],
    "Макияж": [
        ("Дневной макияж", 250000, 60),
        ("Вечерний макияж", 350000, 90),
        ("Свадебный макияж", 600000, 120),
        ("Макияж для фотосессии", 400000, 90),
    ],
    "Массаж": [
        ("Классический массаж тела", 400000, 60),
        ("Антицеллюлитный массаж", 450000, 60),
        ("Массаж лица", 250000, 45),
        ("SPA-программа", 900000, 120),
    ],
    "Барбер": [
        ("Мужская стрижка", 200000, 45),
        ("Стрижка + борода", 300000, 60),
        ("Бритьё опасной бритвой", 250000, 45),
        ("Королевское бритьё", 350000, 60),
        ("Стрижка детская", 150000, 30),
    ],
    "Уход за кожей": [
        ("Чистка лица", 350000, 60),
        ("Пилинг", 400000, 60),
        ("Увлажняющая маска", 250000, 45),
        ("Мезотерапия", 600000, 60),
    ],
}


async def seed():
    async with AsyncSessionLocal() as db:
        print("Starting seed...")

        # Check if already seeded
        existing_admin = await db.execute(select(User).where(User.phone == "+79990000000"))
        if existing_admin.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        # Create admin
        admin = User(
            phone="+79990000000",
            name="Администратор",
            email="admin@krasivo.ru",
            password_hash=hash_password("admin123"),
            role=UserRole.admin,
        )
        db.add(admin)
        await db.flush()
        print(f"Created admin: {admin.phone}")

        # Create service categories
        categories = {}
        for cat_data in CATEGORIES:
            cat = ServiceCategory(
                id=uuid.uuid4(),
                name=cat_data["name"],
                icon=cat_data["icon"],
                sort_order=cat_data["sort_order"],
            )
            db.add(cat)
            categories[cat_data["name"]] = cat
        await db.flush()
        print(f"Created {len(categories)} service categories")

        # Create salon owners (10 owners)
        owners = []
        for i in range(10):
            owner = User(
                phone=f"+7999100{i:04d}",
                name=f"Владелец #{i+1}",
                email=f"owner{i+1}@krasivo.ru",
                password_hash=hash_password("owner123"),
                role=UserRole.salon_owner,
            )
            db.add(owner)
            owners.append(owner)
        await db.flush()
        print(f"Created {len(owners)} salon owners")

        # Create some client users
        clients = []
        client_names = [
            "Мария Смирнова", "Анна Кузнецова", "Ольга Попова",
            "Елена Васильева", "Татьяна Михайлова", "Дмитрий Новиков",
            "Александр Федоров", "Сергей Моrozov", "Михаил Соколов", "Игорь Борисов"
        ]
        for i, name in enumerate(client_names):
            client = User(
                phone=f"+7999200{i:04d}",
                name=name,
                password_hash=hash_password("client123"),
                role=UserRole.client,
            )
            db.add(client)
            clients.append(client)
        await db.flush()
        print(f"Created {len(clients)} clients")

        # Create salons
        salons = []
        for i, salon_data in enumerate(SALONS_DATA):
            owner = owners[i % len(owners)]
            salon = Salon(
                owner_id=owner.id,
                name=salon_data["name"],
                description=salon_data.get("description"),
                address=salon_data["address"],
                city=salon_data["city"],
                avatar_url=salon_data.get("avatar_url"),
                lat=salon_data.get("lat"),
                lng=salon_data.get("lng"),
                phone=salon_data["phone"],
                website=salon_data.get("website"),
                categories=salon_data["categories"],
                is_verified=(i % 3 != 0),  # most verified
                rating=round(4.0 + (i % 10) * 0.1, 1),
                review_count=i * 5 + 10,
            )
            db.add(salon)
            salons.append(salon)
        await db.flush()
        print(f"Created {len(salons)} salons")

        # Create masters (3-5 per salon)
        masters = []
        master_idx = 0
        for salon in salons:
            num_masters = 3 + (salon.review_count % 3)  # 3-5 masters
            for j in range(num_masters):
                mdata = MASTERS_DATA[(master_idx + j) % len(MASTERS_DATA)]
                master = Master(
                    salon_id=salon.id,
                    name=f"{mdata['name']} ({j+1})",
                    bio=f"Мастер с {mdata['experience_years']} годами опыта в области {', '.join(mdata['specializations'][:2])}.",
                    specializations=mdata["specializations"],
                    experience_years=mdata["experience_years"],
                    rating=round(4.0 + ((master_idx + j) % 10) * 0.1, 1),
                    review_count=(master_idx + j) * 2 + 3,
                )
                db.add(master)
                masters.append(master)
            master_idx += num_masters
        await db.flush()
        print(f"Created {len(masters)} masters")

        # Create schedules for all masters (Mon-Fri 10:00-20:00, Sat 10:00-18:00)
        for master in masters:
            for dow in range(7):
                if dow == 6:  # Sunday - not working
                    schedule = MasterSchedule(
                        master_id=master.id,
                        day_of_week=dow,
                        start_time=time(10, 0),
                        end_time=time(18, 0),
                        is_working=False,
                    )
                elif dow == 5:  # Saturday
                    schedule = MasterSchedule(
                        master_id=master.id,
                        day_of_week=dow,
                        start_time=time(10, 0),
                        end_time=time(18, 0),
                        is_working=True,
                    )
                else:  # Mon-Fri
                    schedule = MasterSchedule(
                        master_id=master.id,
                        day_of_week=dow,
                        start_time=time(10, 0),
                        end_time=time(20, 0),
                        is_working=True,
                    )
                db.add(schedule)
        await db.flush()
        print(f"Created schedules for all masters")

        # Create services (5-10 per salon based on their categories)
        services = []
        for salon in salons:
            for cat_name in salon.categories:
                if cat_name in SERVICES_TEMPLATES:
                    templates = SERVICES_TEMPLATES[cat_name]
                    cat = categories.get(cat_name)
                    if not cat:
                        continue
                    # Get a master from this salon with this specialization
                    salon_masters = [m for m in masters if m.salon_id == salon.id]
                    matching_master = None
                    for m in salon_masters:
                        if cat_name in (m.specializations or []):
                            matching_master = m
                            break

                    for name, price, duration in templates[:5]:
                        service = Service(
                            salon_id=salon.id,
                            master_id=matching_master.id if matching_master else None,
                            category_id=cat.id,
                            name=name,
                            price=price,
                            duration_minutes=duration,
                        )
                        db.add(service)
                        services.append(service)
        await db.flush()
        print(f"Created {len(services)} services")

        # Create sample bookings and reviews
        today = date.today()
        bookings = []
        reviews = []

        for i, client in enumerate(clients[:5]):
            for j in range(3):
                if not services or not masters:
                    break
                service = services[(i * 3 + j) % len(services)]
                # Find a master linked to this service's salon
                salon_masters = [m for m in masters if m.salon_id == service.salon_id]
                if not salon_masters:
                    continue
                master = salon_masters[j % len(salon_masters)]
                booking_date = today - timedelta(days=(i * 3 + j + 1))
                # Pick a weekday
                while booking_date.weekday() == 6:
                    booking_date -= timedelta(days=1)

                start_t = time(10 + j * 2, 0)
                end_t = time(10 + j * 2 + service.duration_minutes // 60,
                             service.duration_minutes % 60)

                booking = Booking(
                    client_id=client.id,
                    salon_id=service.salon_id,
                    master_id=master.id,
                    service_id=service.id,
                    date=booking_date,
                    start_time=start_t,
                    end_time=end_t,
                    price=service.price,
                    status=BookingStatus.completed,
                )
                db.add(booking)
                bookings.append(booking)

        await db.flush()
        print(f"Created {len(bookings)} bookings")

        # Create reviews for completed bookings
        ratings = [5, 5, 4, 5, 4, 5, 3, 5, 5, 4, 4, 5, 5, 4, 5]
        texts = [
            "Отличный мастер! Очень довольна результатом.",
            "Замечательный салон, приятная атмосфера. Обязательно вернусь!",
            "Хорошая работа, всё аккуратно и чисто.",
            "Превзошли мои ожидания! Рекомендую всем.",
            "Очень профессиональный подход, комфортно и качественно.",
        ]

        for i, booking in enumerate(bookings):
            review = Review(
                client_id=booking.client_id,
                salon_id=booking.salon_id,
                master_id=booking.master_id,
                booking_id=booking.id,
                rating=ratings[i % len(ratings)],
                text=texts[i % len(texts)],
                photos=[],
            )
            db.add(review)
            reviews.append(review)

        await db.flush()
        print(f"Created {len(reviews)} reviews")

        # Update salon ratings based on reviews
        from sqlalchemy import func
        for salon in salons:
            salon_reviews = [r for r in reviews if r.salon_id == salon.id]
            if salon_reviews:
                avg = sum(r.rating for r in salon_reviews) / len(salon_reviews)
                salon.rating = round(avg, 2)
                salon.review_count = len(salon_reviews)

        # Update master ratings
        for master in masters:
            master_reviews = [r for r in reviews if r.master_id == master.id]
            if master_reviews:
                avg = sum(r.rating for r in master_reviews) / len(master_reviews)
                master.rating = round(avg, 2)
                master.review_count = len(master_reviews)

        await db.flush()
        await db.commit()

        print("\n=== Seed completed successfully! ===")
        print(f"Admin login: phone=+79990000000, password=admin123")
        print(f"Owner login: phone=+79991000000, password=owner123")
        print(f"Client login: phone=+79992000000, password=client123")
        print(f"Total records:")
        print(f"  Users: {1 + len(owners) + len(clients)}")
        print(f"  Salons: {len(salons)}")
        print(f"  Masters: {len(masters)}")
        print(f"  Services: {len(services)}")
        print(f"  Bookings: {len(bookings)}")
        print(f"  Reviews: {len(reviews)}")


async def update_photos_and_icons():
    """Update existing data with photos and clean icons. Always runs."""
    async with AsyncSessionLocal() as db:
        # Update category icons
        for cat_data in CATEGORIES:
            result = await db.execute(select(ServiceCategory).where(ServiceCategory.name == cat_data["name"]))
            cat = result.scalar_one_or_none()
            if cat:
                cat.icon = cat_data["icon"]
        await db.flush()

        # Update salon avatar_url
        for salon_data in SALONS_DATA:
            if salon_data.get("avatar_url"):
                result = await db.execute(select(Salon).where(Salon.name == salon_data["name"]))
                salon = result.scalar_one_or_none()
                if salon and not salon.avatar_url:
                    salon.avatar_url = salon_data["avatar_url"]
        await db.flush()
        await db.commit()
        print("Photos and icons updated.")


if __name__ == "__main__":
    async def main():
        await seed()
        await update_photos_and_icons()
    asyncio.run(main())
