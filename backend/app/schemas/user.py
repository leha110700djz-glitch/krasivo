import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import uuid
from app.models.user import UserRole

_PHONE_RE = re.compile(r"^\+?[0-9]{10,15}$")


class UserBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    phone: str
    name: str
    password: str
    role: UserRole = UserRole.client

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        if not _PHONE_RE.match(cleaned):
            raise ValueError("Некорректный номер телефона. Используйте формат +7XXXXXXXXXX")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен содержать не менее 8 символов")
        if not any(c.isdigit() for c in v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    phone: str
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    phone: str
    email: Optional[str] = None
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class UploadAvatarResponse(BaseModel):
    url: str
