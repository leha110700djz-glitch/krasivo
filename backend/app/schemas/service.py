from pydantic import BaseModel
from typing import Optional, List
import uuid


class ServiceCategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    icon: Optional[str] = None
    sort_order: int

    model_config = {"from_attributes": True}


class ServiceBase(BaseModel):
    salon_id: uuid.UUID
    master_id: Optional[uuid.UUID] = None
    category_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: int  # in kopecks
    duration_minutes: int


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    master_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    master_id: Optional[uuid.UUID] = None
    category_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: int
    duration_minutes: int
    is_active: bool
    category: Optional[ServiceCategoryOut] = None

    model_config = {"from_attributes": True}
