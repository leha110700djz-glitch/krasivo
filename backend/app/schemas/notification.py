from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class NotificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    data: Dict[str, Any] = {}
    is_read: bool
    created_at: datetime
    sent_at: Optional[datetime] = None
    push_delivered: bool = False

    model_config = {"from_attributes": True}
