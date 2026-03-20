from typing import Optional
from pydantic import BaseModel

class InventoryItemBase(BaseModel):
    name: str
    quantity: float = 0.0
    min_quantity: float = 0.0

class InventoryItemCreate(InventoryItemBase):
    room_id: int

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    min_quantity: Optional[float] = None

class InventoryItem(InventoryItemBase):
    id: int
    room_id: int

    class Config:
        from_attributes = True
