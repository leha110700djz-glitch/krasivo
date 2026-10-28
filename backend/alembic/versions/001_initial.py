"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("bio", sa.String(2000), nullable=True),
        sa.Column(
            "role",
            sa.Enum("client", "salon_owner", "master", "admin", name="userrole"),
            nullable=False,
            server_default="client",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_phone", "users", ["phone"])
    op.create_index("ix_users_email", "users", ["email"])

    # salons
    op.create_table(
        "salons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("photos", JSONB(), nullable=False, server_default="[]"),
        sa.Column("categories", JSONB(), nullable=False, server_default="[]"),
        sa.Column("rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_salons_owner_id", "salons", ["owner_id"])
    op.create_index("ix_salons_city", "salons", ["city"])
    op.create_index("ix_salons_name", "salons", ["name"])

    # masters
    op.create_table(
        "masters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("salon_id", UUID(as_uuid=True), sa.ForeignKey("salons.id"), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("specializations", JSONB(), nullable=False, server_default="[]"),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_masters_salon_id", "masters", ["salon_id"])
    op.create_index("ix_masters_user_id", "masters", ["user_id"])

    # service_categories
    op.create_table(
        "service_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    # services
    op.create_table(
        "services",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("salon_id", UUID(as_uuid=True), sa.ForeignKey("salons.id"), nullable=False),
        sa.Column("master_id", UUID(as_uuid=True), sa.ForeignKey("masters.id"), nullable=True),
        sa.Column("category_id", UUID(as_uuid=True), sa.ForeignKey("service_categories.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_services_salon_id", "services", ["salon_id"])
    op.create_index("ix_services_master_id", "services", ["master_id"])
    op.create_index("ix_services_category_id", "services", ["category_id"])

    # master_schedules
    op.create_table(
        "master_schedules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("master_id", UUID(as_uuid=True), sa.ForeignKey("masters.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_working", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_master_schedules_master_id", "master_schedules", ["master_id"])

    # bookings
    op.create_table(
        "bookings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("client_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("salon_id", UUID(as_uuid=True), sa.ForeignKey("salons.id"), nullable=False),
        sa.Column("master_id", UUID(as_uuid=True), sa.ForeignKey("masters.id"), nullable=False),
        sa.Column("service_id", UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "confirmed", "completed", "cancelled", "no_show", name="bookingstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("cancel_reason", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_bookings_client_id", "bookings", ["client_id"])
    op.create_index("ix_bookings_salon_id", "bookings", ["salon_id"])
    op.create_index("ix_bookings_master_id", "bookings", ["master_id"])
    op.create_index("ix_bookings_service_id", "bookings", ["service_id"])
    op.create_index("ix_bookings_date", "bookings", ["date"])
    op.create_index("ix_bookings_status", "bookings", ["status"])

    # reviews
    op.create_table(
        "reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("client_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("salon_id", UUID(as_uuid=True), sa.ForeignKey("salons.id"), nullable=False),
        sa.Column("master_id", UUID(as_uuid=True), sa.ForeignKey("masters.id"), nullable=True),
        sa.Column("booking_id", UUID(as_uuid=True), sa.ForeignKey("bookings.id"), unique=True, nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("photos", JSONB(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("booking_id", name="uq_review_booking"),
    )
    op.create_index("ix_reviews_client_id", "reviews", ["client_id"])
    op.create_index("ix_reviews_salon_id", "reviews", ["salon_id"])
    op.create_index("ix_reviews_master_id", "reviews", ["master_id"])

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.String(1000), nullable=False),
        sa.Column("data", JSONB(), nullable=False, server_default="{}"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # portfolio
    op.create_table(
        "portfolio",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("master_id", UUID(as_uuid=True), sa.ForeignKey("masters.id"), nullable=False),
        sa.Column("image_url", sa.String(1024), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_portfolio_master_id", "portfolio", ["master_id"])


def downgrade() -> None:
    op.drop_table("portfolio")
    op.drop_table("notifications")
    op.drop_table("reviews")
    op.drop_table("bookings")
    op.drop_table("master_schedules")
    op.drop_table("services")
    op.drop_table("service_categories")
    op.drop_table("masters")
    op.drop_table("salons")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS bookingstatus")
