from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime
import uuid


class SalonBase(BaseModel):
    name: str = Field(..., max_length=200, strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=2000)
    address: str
    city: str
    phone: str
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    categories: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None


class SalonCreate(SalonBase):
    pass


class SalonUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200, strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=2000)
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    categories: Optional[List[str]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class SalonOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: Optional[str] = None
    address: str
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: str
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    photos: List[str] = []
    categories: List[str] = []
    rating: float
    review_count: int
    reviews_count: int = 0
    cover_photo: Optional[str] = None
    masters_count: int = 0
    min_price: Optional[int] = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def derive_fields(self) -> "SalonOut":
        if self.cover_photo is None:
            self.cover_photo = self.avatar_url or (self.photos[0] if self.photos else None)
        self.reviews_count = self.review_count
        return self


class SalonDetail(SalonOut):
    master_count: int = 0
    service_count: int = 0


class SalonListResponse(BaseModel):
    items: List[SalonOut]
    total: int
    page: int
    pages: int


class SalonStats(BaseModel):
    total_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    total_revenue: int  # in kopecks
    revenue_period: int  # in kopecks for requested period
    top_services: List[dict]
    bookings_by_day: List[dict]
