from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.room import RoleEnum
from app.schemas.user import User

# Shared properties
class RoomBase(BaseModel):
    name: Optional[str] = None

# Properties to receive on room creation
class RoomCreate(RoomBase):
    name: str

# Properties to receive on room update
class RoomUpdate(RoomBase):
    pass

class RoomInDBBase(RoomBase):
    id: int
    invite_code: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Properties to return to client
class Room(RoomInDBBase):
    pass

# Room Member Schema
class RoomMemberBase(BaseModel):
    room_id: int
    user_id: int
    role: RoleEnum

class RoomMemberCreate(RoomMemberBase):
    pass

class RoomMember(RoomMemberBase):
    id: int
    user: User

    class Config:
        from_attributes = True
