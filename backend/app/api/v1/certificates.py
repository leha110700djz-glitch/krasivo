"""
Gift certificates API — owner CRUD + public check + client redeem.
"""
import uuid
import random
import string
from datetime import datetime, timezone
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.gift_certificate import GiftCertificate
from app.models.user import User, UserRole
from app.models.salon import Salon
from app.schemas.gift_certificate import (
    GiftCertificateOut,
    GiftCertificateCreate,
    GiftCertificateCheck,
    GiftCertificateRedeem,
    GiftCertificateRedeemResult,
)
from app.deps import get_current_active_user

router = APIRouter(prefix="/certificates", tags=["Gift Certificates"])


def _generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))


async def _get_owner_salon(db: AsyncSession, user: User) -> Salon:
    """Return the salon owned by the user, or raise 403/404."""
    if user.role not in [UserRole.salon_owner, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Owners only")
    res = await db.execute(select(Salon).where(Salon.owner_id == user.id))
    salon = res.scalar_one_or_none()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/check/{code}", response_model=GiftCertificateCheck)
async def check_certificate(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Public: check certificate validity and remaining amount."""
    res = await db.execute(
        select(GiftCertificate).where(GiftCertificate.code == code.upper().strip())
    )
    cert = res.scalar_one_or_none()

    if not cert:
        return GiftCertificateCheck(
            valid=False, code=code.upper(), title="", message="Сертификат не найден"
        )

    now = datetime.now(timezone.utc)
    if not cert.is_active:
        return GiftCertificateCheck(
            valid=False, code=cert.code, title=cert.title,
            remaining_amount=cert.remaining_amount,
            expires_at=cert.expires_at,
            message="Сертификат недействителен",
        )
    if cert.expires_at and cert.expires_at < now:
        return GiftCertificateCheck(
            valid=False, code=cert.code, title=cert.title,
            remaining_amount=cert.remaining_amount,
            expires_at=cert.expires_at,
            message="Срок действия сертификата истёк",
        )
    if cert.remaining_amount <= 0:
        return GiftCertificateCheck(
            valid=False, code=cert.code, title=cert.title,
            remaining_amount=cert.remaining_amount,
            expires_at=cert.expires_at,
            message="Баланс сертификата исчерпан",
        )

    return GiftCertificateCheck(
        valid=True, code=cert.code, title=cert.title,
        remaining_amount=cert.remaining_amount,
        expires_at=cert.expires_at,
        message=f"Доступно {cert.remaining_amount} ₽",
    )


# ── Owner endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=GiftCertificateOut, status_code=status.HTTP_201_CREATED)
async def create_certificate(
    body: GiftCertificateCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner creates a gift certificate for their salon."""
    salon = await _get_owner_salon(db, current_user)

    # Generate unique code if not provided
    code = body.code or _generate_code()
    # Ensure uniqueness
    for _ in range(5):
        existing = await db.execute(
            select(GiftCertificate).where(GiftCertificate.code == code)
        )
        if not existing.scalar_one_or_none():
            break
        code = _generate_code()

    cert = GiftCertificate(
        code=code,
        title=body.title,
        original_amount=body.amount,
        remaining_amount=body.amount,
        issued_by_salon_id=salon.id,
        purchased_by_user_id=current_user.id,
        recipient_name=body.recipient_name,
        recipient_email=body.recipient_email,
        message=body.message,
        expires_at=body.expires_at,
    )
    db.add(cert)
    await db.flush()
    await db.refresh(cert)
    return GiftCertificateOut.model_validate(cert)


@router.get("", response_model=List[GiftCertificateOut])
async def list_certificates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner lists all certificates for their salon."""
    salon = await _get_owner_salon(db, current_user)
    result = await db.execute(
        select(GiftCertificate)
        .where(GiftCertificate.issued_by_salon_id == salon.id)
        .order_by(GiftCertificate.created_at.desc())
    )
    return [GiftCertificateOut.model_validate(c) for c in result.scalars().all()]


# ── Client endpoints ──────────────────────────────────────────────────────────

@router.get("/mine", response_model=List[GiftCertificateOut])
async def list_my_certificates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Client: list certificates I purchased or received (by email)."""
    filters = [GiftCertificate.purchased_by_user_id == current_user.id]
    if current_user.email:
        filters.append(GiftCertificate.recipient_email == current_user.email)

    result = await db.execute(
        select(GiftCertificate)
        .where(or_(*filters))
        .order_by(GiftCertificate.created_at.desc())
    )
    return [GiftCertificateOut.model_validate(c) for c in result.scalars().all()]


@router.post("/redeem", response_model=GiftCertificateRedeemResult)
async def redeem_certificate(
    body: GiftCertificateRedeem,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Client redeems a gift certificate, deducting from its balance."""
    res = await db.execute(
        select(GiftCertificate).where(GiftCertificate.code == body.code.upper().strip())
    )
    cert = res.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Сертификат не найден")

    now = datetime.now(timezone.utc)
    if not cert.is_active:
        raise HTTPException(status_code=400, detail="Сертификат недействителен")
    if cert.expires_at and cert.expires_at < now:
        raise HTTPException(status_code=400, detail="Срок действия сертификата истёк")
    if cert.remaining_amount <= 0:
        raise HTTPException(status_code=400, detail="Баланс сертификата исчерпан")

    discount = min(body.amount_to_use, cert.remaining_amount)
    cert.remaining_amount = cert.remaining_amount - discount

    if cert.remaining_amount <= 0:
        cert.is_active = False
        cert.used_at = now

    await db.flush()
    return GiftCertificateRedeemResult(
        discount_applied=discount,
        remaining_amount=cert.remaining_amount,
    )
