import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import aiofiles

from app.database import get_db
from app.models.user import User, UserRole
from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction
from app.models.revoked_token import RevokedToken
from app.schemas.user import UserCreate, UserLogin, TokenResponse, RefreshRequest, UserOut, UserUpdate, UploadAvatarResponse
from app.services.auth import hash_password, verify_password, create_access_token, create_refresh_token, verify_refresh_token
from app.deps import get_current_active_user
from app.config import settings
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, body: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if phone already exists
    result = await db.execute(select(User).where(User.phone == body.phone))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        phone=body.phone,
        name=body.name,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Create loyalty account with welcome bonus
    loyalty_account = LoyaltyAccount(
        user_id=user.id,
        points=100,
        lifetime_points=100,
    )
    db.add(loyalty_account)
    await db.flush()
    await db.refresh(loyalty_account)

    welcome_tx = LoyaltyTransaction(
        account_id=loyalty_account.id,
        points=100,
        reason="welcome_bonus",
        description="Приветственный бонус за регистрацию",
    )
    db.add(welcome_tx)
    await db.flush()

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check blacklist
    jti = payload.get("jti")
    if jti:
        revoked_result = await db.execute(
            select(RevokedToken).where(RevokedToken.jti == jti)
        )
        if revoked_result.scalar_one_or_none():
            raise HTTPException(status_code=401, detail="Token has been revoked")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Blacklist the provided refresh token so it cannot be used again."""
    payload = verify_refresh_token(body.refresh_token)
    if not payload:
        # Token already invalid; treat as successful logout
        return

    jti = payload.get("jti")
    if not jti:
        return

    # Avoid duplicate inserts
    existing = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    if existing.scalar_one_or_none():
        return

    exp_timestamp = payload.get("exp")
    if exp_timestamp:
        expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    else:
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    revoked = RevokedToken(
        jti=jti,
        expires_at=expires_at,
    )
    db.add(revoked)
    await db.flush()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None:
        current_user.email = body.email
    if body.bio is not None:
        current_user.bio = body.bio
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    await db.flush()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/upload-avatar", response_model=UploadAvatarResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = url
    await db.flush()

    return UploadAvatarResponse(url=url)


@router.post("/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def register_push_token(
    body: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Store FCM/APNs push token for this user."""
    token = body.get("token", "").strip()
    if token:
        current_user.push_token = token
        await db.flush()


@router.delete("/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_push_token(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove push token (on logout)."""
    current_user.push_token = None
    await db.flush()
