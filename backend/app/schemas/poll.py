from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PollOptionBase(BaseModel):
    option_text: str

class PollOptionCreate(PollOptionBase):
    pass

class PollOption(PollOptionBase):
    id: int
    poll_id: int
    vote_count: int = 0

    class Config:
        from_attributes = True

class PollBase(BaseModel):
    question: str

class PollCreate(PollBase):
    room_id: int
    options: List[str]

class Poll(PollBase):
    id: int
    room_id: int
    created_by: int
    created_at: datetime
    options: List[PollOption]

    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    poll_option_id: int

class Vote(BaseModel):
    id: int
    user_id: int
    poll_option_id: int
    created_at: datetime

    class Config:
        from_attributes = True
