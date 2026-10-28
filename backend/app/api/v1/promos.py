"""
Promo codes API — public check + owner CRUD + push token registration.
"""
import uuid
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.promo import Promo, PromoUsage, DiscountType
from app.models.user import User, UserRole
from app.schemas.promo import PromoOut, PromoCheck, PromoCreate
from app.deps import get_current_active_user

router = APIRouter(prefix="/promos", tags=["Promos"])


def _calc_discount(promo: Promo, price: Optional[int]) -> tuple[Optional[int], Optional[int]]:
    """Return (discount_amount_kopecks, final_price_kopecks) or (None, None)."""
    if price is None:
        return None, None
    if promo.discount_type == DiscountType.percent:
        discount = int(price * promo.discount_value / 100)
    else:
        discount = min(promo.discount_value, price)
    return discount, max(0, price - discount)


def _validate_promo(promo: Promo, salon_id: Optional[uuid.UUID] = None) -> Optional[str]:
    """Return error message or None if valid."""
    today = date.today()
    if not promo.is_active:
        return "Промокод недействителен"
    if promo.starts_at and today < promo.starts_at:
        return "Промокод ещё не активен"
    if promo.expires_at and today > promo.expires_at:
        return "Срок действия промокода истёк"
    if promo.max_uses is not None and promo.uses_count >= promo.max_uses:
        return "Промокод исчерпан"
    if promo.salon_id and salon_id and promo.salon_id != salon_id:
        return "Промокод не действует для этого салона"
    return None


@router.get("/check/{code}", response_model=PromoCheck)
async def check_promo(
    code: str,
    price: Optional[int] = Query(None, description="Booking price in kopecks to calculate discount"),
    salon_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — check if a promo code is valid."""
    result = await db.execute(select(Promo).where(Promo.code == code.upper().strip()))
    promo = result.scalar_one_or_none()

    if not promo:
        return PromoCheck(
            valid=False, code=code.upper(), title="", discount_type=DiscountType.percent,
            discount_value=0, min_order=0, message="Промокод не найден",
        )

    error = _validate_promo(promo, salon_id)
    if error:
        return PromoCheck(
            valid=False, code=code.upper(), title=promo.title, description=promo.description,
            discount_type=promo.discount_type, discount_value=promo.discount_value,
            min_order=promo.min_order, message=error,
        )

    if price is not None and price < promo.min_order:
        return PromoCheck(
            valid=False, code=code.upper(), title=promo.title, description=promo.description,
            discount_type=promo.discount_type, discount_value=promo.discount_value,
            min_order=promo.min_order,
            message=f"Минимальная сумма заказа {promo.min_order // 100} ₽",
        )

    discount_amount, final_price = _calc_discount(promo, price)
    label = f"{promo.discount_value}%" if promo.discount_type == DiscountType.percent else f"{promo.discount_value // 100} ₽"
    return PromoCheck(
        valid=True, code=promo.code, title=promo.title, description=promo.description,
        discount_type=promo.discount_type, discount_value=promo.discount_value,
        min_order=promo.min_order, discount_amount=discount_amount, final_price=final_price,
        message=f"Скидка {label} применена!",
    )


@router.get("", response_model=List[PromoOut])
async def list_active_promos(
    salon_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public: list active platform-wide or salon-specific promos."""
    today = date.today()
    query = select(Promo).where(
        Promo.is_active == True,
        (Promo.starts_at == None) | (Promo.starts_at <= today),
        (Promo.expires_at == None) | (Promo.expires_at >= today),
    )
    if salon_id:
        from sqlalchemy import or_
        query = query.where(or_(Promo.salon_id == salon_id, Promo.salon_id == None))
    else:
        query = query.where(Promo.salon_id == None)
    result = await db.execute(query.order_by(Promo.created_at.desc()).limit(20))
    return [PromoOut.model_validate(p) for p in result.scalars().all()]


# ── Owner promo management ────────────────────────────────────────────────────

@router.post("", response_model=PromoOut, status_code=status.HTTP_201_CREATED)
async def create_promo(
    body: PromoCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Owners only")
    promo = Promo(**body.model_dump())
    db.add(promo)
    await db.flush()
    await db.refresh(promo)
    return PromoOut.model_validate(promo)


@router.get("/mine", response_model=List[PromoOut])
async def list_my_promos(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Owners only")
    # Get owner's salon
    from app.models.salon import Salon
    salon_res = await db.execute(select(Salon).where(Salon.owner_id == current_user.id))
    salon = salon_res.scalar_one_or_none()
    if not salon:
        return []
    result = await db.execute(
        select(Promo).where(Promo.salon_id == salon.id).order_by(Promo.created_at.desc())
    )
    return [PromoOut.model_validate(p) for p in result.scalars().all()]


@router.delete("/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promo(
    promo_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Promo).where(Promo.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo not found")
    if current_user.role != UserRole.admin:
        from app.models.salon import Salon
        salon_res = await db.execute(select(Salon).where(Salon.owner_id == current_user.id))
        salon = salon_res.scalar_one_or_none()
        if not salon or promo.salon_id != salon.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    promo.is_active = False
    await db.flush()
