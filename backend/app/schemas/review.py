from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import uuid


class ReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int
    text: Optional[str] = None
    photos: List[str] = []

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    salon_id: uuid.UUID
    master_id: Optional[uuid.UUID] = None
    booking_id: uuid.UUID
    rating: int
    text: Optional[str] = None
    photos: List[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewDetail(ReviewOut):
    client_name: Optional[str] = None
    client_avatar: Optional[str] = None
