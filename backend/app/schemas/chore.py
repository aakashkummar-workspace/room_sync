from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.chore import ChoreStatus

class ChoreBase(BaseModel):
    title: str
    assigned_to: int
    due_date: datetime
    is_recurring: bool = False

class ChoreCreate(ChoreBase):
    room_id: int

class ChoreUpdate(BaseModel):
    status: Optional[ChoreStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class Chore(ChoreBase):
    id: int
    room_id: int
    status: ChoreStatus
    created_at: datetime

    class Config:
        from_attributes = True
