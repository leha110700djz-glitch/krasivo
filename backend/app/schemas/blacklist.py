from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class BlacklistedClientOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    client_user_id: Optional[uuid.UUID] = None
    client_phone: Optional[str] = None
    client_name: Optional[str] = None
    reason: Optional[str] = None
    added_by_user_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BlacklistAdd(BaseModel):
    client_user_id: Optional[uuid.UUID] = None
    client_phone: Optional[str] = None
    client_name: Optional[str] = None
    reason: Optional[str] = None
