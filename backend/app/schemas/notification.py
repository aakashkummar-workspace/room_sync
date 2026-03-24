from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str


class NotificationCreate(NotificationBase):
    room_id: int
    user_id: int
    created_by: int


class Notification(NotificationBase):
    id: int
    room_id: int
    user_id: int
    is_read: bool
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True
