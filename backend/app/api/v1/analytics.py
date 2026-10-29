"""
Analytics API — detailed analytics for salon owners.
All routes require authentication as salon_owner or admin.
Prices stored in kopecks; returned values divided by 100 (rubles).
"""
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.database import get_db
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.deps import get_current_active_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owner_salon(user: User, db: AsyncSession) -> Salon:
    result = await db.execute(select(Salon).where(Salon.owner_id == user.id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="No salon found.")
    return salon


def _require_owner(user: User) -> None:
    if user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Salon owners only")


def _period_days(period: str) -> int:
    return {"7d": 7, "30d": 30, "90d": 90, "year": 365}.get(period, 30)


def _pct_change(current: float, prev: float) -> float:
    if prev == 0:
        return 0.0 if current == 0 else 100.0
    return round((current - prev) / prev * 100, 1)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/overview")
async def analytics_overview(
    period: str = Query("30d", pattern="^(7d|30d|90d|year)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """KPI overview with period-over-period comparison."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    days = _period_days(period)
    today = date.today()
    cur_start = today - timedelta(days=days)
    prev_start = today - timedelta(days=days * 2)
    prev_end = cur_start - timedelta(days=1)

    # Current period aggregates
    row_cur = (await db.execute(text("""
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN price END), 0) AS revenue,
          COUNT(*)                                                          AS bookings,
          COUNT(CASE WHEN status = 'completed'              THEN 1 END)   AS completed,
          COUNT(CASE WHEN status IN ('cancelled','no_show') THEN 1 END)   AS cancelled
        FROM bookings
        WHERE salon_id = :sid AND date >= :cur_start AND date <= :today
    """), {"sid": sid, "cur_start": cur_start, "today": today})).fetchone()

    # Previous period aggregates
    row_prev = (await db.execute(text("""
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN price END), 0) AS revenue,
          COUNT(*)                                                          AS bookings,
          COUNT(CASE WHEN status = 'completed'              THEN 1 END)   AS completed
        FROM bookings
        WHERE salon_id = :sid AND date >= :prev_start AND date <= :prev_end
    """), {"sid": sid, "prev_start": prev_start, "prev_end": prev_end})).fetchone()

    # New clients (first booking in salon falls within each period)
    new_cur = (await db.execute(text("""
        SELECT COUNT(*) FROM (
          SELECT client_id FROM bookings
          WHERE salon_id = :sid
          GROUP BY client_id
          HAVING MIN(date) >= :cur_start
        ) t
    """), {"sid": sid, "cur_start": cur_start})).scalar() or 0

    new_prev = (await db.execute(text("""
        SELECT COUNT(*) FROM (
          SELECT client_id FROM bookings
          WHERE salon_id = :sid
          GROUP BY client_id
          HAVING MIN(date) BETWEEN :prev_start AND :prev_end
        ) t
    """), {"sid": sid, "prev_start": prev_start, "prev_end": prev_end})).scalar() or 0

    # Return rate: % of clients with >1 completed booking (all-time)
    ret_row = (await db.execute(text("""
        SELECT
          COUNT(DISTINCT client_id)                                        AS total,
          COUNT(DISTINCT CASE WHEN cnt > 1 THEN client_id END)            AS returning
        FROM (
          SELECT client_id, COUNT(*) AS cnt
          FROM bookings
          WHERE salon_id = :sid AND status = 'completed'
          GROUP BY client_id
        ) t
    """), {"sid": sid})).fetchone()

    # Derive values
    cur_rev = float(row_cur.revenue or 0) / 100
    prev_rev = float(row_prev.revenue or 0) / 100
    cur_bk = int(row_cur.bookings or 0)
    prev_bk = int(row_prev.bookings or 0)
    cur_completed = int(row_cur.completed or 0)
    prev_completed = int(row_prev.completed or 0)
    cur_cancelled = int(row_cur.cancelled or 0)
    cur_avg = cur_rev / cur_completed if cur_completed > 0 else 0.0
    prev_avg = prev_rev / prev_completed if prev_completed > 0 else 0.0
    total_cl = int(ret_row.total or 0) if ret_row else 0
    returning = int(ret_row.returning or 0) if ret_row else 0

    return {
        "revenue": {
            "current": round(cur_rev, 2),
            "prev": round(prev_rev, 2),
            "change_pct": _pct_change(cur_rev, prev_rev),
        },
        "bookings_count": {
            "current": cur_bk,
            "prev": prev_bk,
            "change_pct": _pct_change(cur_bk, prev_bk),
        },
        "new_clients": {
            "current": int(new_cur),
            "prev": int(new_prev),
            "change_pct": _pct_change(new_cur, new_prev),
        },
        "avg_check": {
            "current": round(cur_avg, 2),
            "prev": round(prev_avg, 2),
            "change_pct": _pct_change(cur_avg, prev_avg),
        },
        "return_rate": round(returning / total_cl * 100, 1) if total_cl > 0 else 0.0,
        "cancellation_rate": round(cur_cancelled / cur_bk * 100, 1) if cur_bk > 0 else 0.0,
        "completion_rate": round(cur_completed / cur_bk * 100, 1) if cur_bk > 0 else 0.0,
    }


@router.get("/revenue_chart")
async def analytics_revenue_chart(
    period: str = Query("30d", pattern="^(30d|90d|year)$"),
    group: str = Query("day", pattern="^(day|week|month)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Revenue and booking count over time, grouped by day/week/month."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    days = _period_days(period)
    start = date.today() - timedelta(days=days)

    # Build date expression based on grouping
    if group == "day":
        date_expr = "date"
        group_expr = "date"
    elif group == "week":
        date_expr = "DATE_TRUNC('week', date)::date"
        group_expr = "DATE_TRUNC('week', date)"
    else:  # month
        date_expr = "DATE_TRUNC('month', date)::date"
        group_expr = "DATE_TRUNC('month', date)"

    sql = text(f"""
        SELECT
          {date_expr}::text AS date,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN price END), 0)::float / 100 AS revenue,
          COUNT(*) AS bookings
        FROM bookings
        WHERE salon_id = :sid AND date >= :start
        GROUP BY {group_expr}
        ORDER BY {group_expr}
    """)

    rows = (await db.execute(sql, {"sid": sid, "start": start})).fetchall()
    return [{"date": r.date, "revenue": float(r.revenue), "bookings": int(r.bookings)} for r in rows]


@router.get("/top_services")
async def analytics_top_services(
    period: str = Query("30d", pattern="^(7d|30d|90d|year)$"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Top services by booking count with revenue and avg rating."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    days = _period_days(period)
    start = date.today() - timedelta(days=days)

    rows = (await db.execute(text("""
        SELECT
          s.name                                                           AS service_name,
          COUNT(b.id)                                                      AS count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0)::float / 100
                                                                           AS revenue,
          COALESCE(AVG(r.rating), 0)                                       AS avg_rating
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE b.salon_id = :sid AND b.date >= :start
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT :limit
    """), {"sid": sid, "start": start, "limit": limit})).fetchall()

    return [
        {
            "service_name": r.service_name,
            "count": int(r.count),
            "revenue": round(float(r.revenue), 2),
            "avg_rating": round(float(r.avg_rating), 2),
        }
        for r in rows
    ]


@router.get("/top_masters")
async def analytics_top_masters(
    period: str = Query("30d", pattern="^(7d|30d|90d|year)$"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Top masters by booking count with revenue, avg rating and completion rate."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    days = _period_days(period)
    start = date.today() - timedelta(days=days)

    rows = (await db.execute(text("""
        SELECT
          m.name                                                                        AS master_name,
          COUNT(b.id)                                                                   AS count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0)::float / 100
                                                                                       AS revenue,
          COALESCE(AVG(r.rating), 0)                                                   AS avg_rating,
          ROUND(
            COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::numeric
            / NULLIF(COUNT(b.id), 0) * 100, 1
          )                                                                             AS completion_rate
        FROM bookings b
        JOIN masters m ON m.id = b.master_id
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE b.salon_id = :sid AND b.date >= :start
        GROUP BY m.id, m.name
        ORDER BY count DESC
        LIMIT :limit
    """), {"sid": sid, "start": start, "limit": limit})).fetchall()

    return [
        {
            "master_name": r.master_name,
            "count": int(r.count),
            "revenue": round(float(r.revenue), 2),
            "avg_rating": round(float(r.avg_rating), 2),
            "completion_rate": float(r.completion_rate or 0),
        }
        for r in rows
    ]


@router.get("/client_segments")
async def analytics_client_segments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Client segmentation based on visit history."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    row = (await db.execute(text("""
        SELECT
          COUNT(DISTINCT client_id)                                                     AS total,
          COUNT(DISTINCT CASE WHEN visit_count = 1                  THEN client_id END) AS new_cl,
          COUNT(DISTINCT CASE WHEN visit_count BETWEEN 2 AND 5      THEN client_id END) AS returning_cl,
          COUNT(DISTINCT CASE WHEN visit_count >= 6                 THEN client_id END) AS loyal_cl,
          COUNT(DISTINCT CASE WHEN days_since BETWEEN 61 AND 180    THEN client_id END) AS sleeping_cl,
          COUNT(DISTINCT CASE WHEN days_since > 180                 THEN client_id END) AS lost_cl
        FROM (
          SELECT
            client_id,
            COUNT(*)                        AS visit_count,
            CURRENT_DATE - MAX(date)        AS days_since
          FROM bookings
          WHERE salon_id = :sid AND status = 'completed'
          GROUP BY client_id
        ) t
    """), {"sid": sid})).fetchone()

    return {
        "total": int(row.total or 0) if row else 0,
        "new": int(row.new_cl or 0) if row else 0,
        "returning": int(row.returning_cl or 0) if row else 0,
        "loyal": int(row.loyal_cl or 0) if row else 0,
        "sleeping": int(row.sleeping_cl or 0) if row else 0,
        "lost": int(row.lost_cl or 0) if row else 0,
    }


@router.get("/hourly_heatmap")
async def analytics_hourly_heatmap(
    period: str = Query("30d", pattern="^(7d|30d|90d|year)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Booking heatmap by hour (0-23) and weekday (1=Mon … 7=Sun)."""
    _require_owner(current_user)
    salon = await _get_owner_salon(current_user, db)
    sid = str(salon.id)

    days = _period_days(period)
    start = date.today() - timedelta(days=days)

    rows = (await db.execute(text("""
        SELECT
          EXTRACT(HOUR FROM start_time)::int  AS hour,
          EXTRACT(ISODOW FROM date)::int      AS weekday,
          COUNT(*)                            AS count
        FROM bookings
        WHERE salon_id = :sid
          AND date >= :start
          AND status NOT IN ('cancelled', 'no_show')
        GROUP BY EXTRACT(HOUR FROM start_time), EXTRACT(ISODOW FROM date)
        ORDER BY weekday, hour
    """), {"sid": sid, "start": start})).fetchall()

    return [{"hour": r.hour, "weekday": r.weekday, "count": int(r.count)} for r in rows]
