from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class DashboardStat(BaseModel):
    title: str
    value: str
    trend: Optional[float] = None
    color: Optional[str] = ""
    icon: Optional[str] = ""

class RecentActivity(BaseModel):
    id: int
    type: str # 'expense', 'chore', 'notice'
    title: str
    amount: Optional[float] = 0
    user: str
    time: str # formatted time like "2h ago"

class DashboardSummary(BaseModel):
    user_name: str
    room_id: Optional[int] = None
    room_name: Optional[str] = None
    invite_code: Optional[str] = None
    pending_chores_count: int
    unsettled_bills_count: int
    total_room_expenses: Optional[int] = 0
    stats: List[DashboardStat]
    recent_activity: List[RecentActivity]
    room_members: List[dict] = []
