from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class ExpenseSplitBase(BaseModel):
    user_id: int
    amount_owed: float

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplit(ExpenseSplitBase):
    id: int
    expense_id: int
    is_paid: bool

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    attachment: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    room_id: int
    splits: List[ExpenseSplitCreate]

class Expense(ExpenseBase):
    id: int
    room_id: int
    paid_by: int
    paid_by_name: Optional[str] = None
    created_at: datetime
    splits: List[ExpenseSplit] = []

    class Config:
        from_attributes = True
