from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time
import uuid


class MasterBase(BaseModel):
    name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    specializations: List[str] = []
    experience_years: Optional[int] = None


class MasterCreate(MasterBase):
    salon_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None


class MasterUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    specializations: Optional[List[str]] = None
    experience_years: Optional[int] = None


class MasterOut(BaseModel):
    id: uuid.UUID
    salon_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    specializations: List[str] = []
    experience_years: Optional[int] = None
    rating: float
    review_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ScheduleItem(BaseModel):
    day_of_week: int  # 0=Mon..6=Sun
    start_time: time
    end_time: time
    is_working: bool


class ScheduleOut(BaseModel):
    id: uuid.UUID
    master_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_working: bool

    model_config = {"from_attributes": True}


class ScheduleUpdate(BaseModel):
    schedule: List[ScheduleItem]


class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    available: bool


class PortfolioItem(BaseModel):
    id: uuid.UUID
    master_id: uuid.UUID
    image_url: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
