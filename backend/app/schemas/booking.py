from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING, Any
from datetime import datetime, date, time
import uuid
from app.models.booking import BookingStatus

if TYPE_CHECKING:
    from app.schemas.user import UserOut
    from app.schemas.salon import SalonOut
    from app.schemas.master import MasterOut
    from app.schemas.service import ServiceOut


class BookingCreate(BaseModel):
    master_id: uuid.UUID
    service_id: uuid.UUID
    date: date
    start_time: time
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    salon_id: uuid.UUID
    master_id: uuid.UUID
    service_id: uuid.UUID
    date: date
    start_time: time
    end_time: time
    price: int
    status: BookingStatus
    notes: Optional[str] = None
    cancel_reason: Optional[str] = None
    created_at: datetime
    # Enriched fields set by dashboard endpoints
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    master_name: Optional[str] = None
    service_name: Optional[str] = None

    model_config = {"from_attributes": True}


class BookingDetail(BookingOut):
    client: Optional[Any] = None
    salon: Optional[Any] = None
    master: Optional[Any] = None
    service: Optional[Any] = None


class CancelBookingRequest(BaseModel):
    reason: Optional[str] = None
