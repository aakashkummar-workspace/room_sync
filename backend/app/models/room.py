from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base
import enum

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = relationship("RoomMember", back_populates="room")
    expenses = relationship("Expense", back_populates="room")
    chores = relationship("Chore", back_populates="room")
    inventory_items = relationship("InventoryItem", back_populates="room")
    polls = relationship("Poll", back_populates="room")
    notices = relationship("Notice", back_populates="room")
    calendar_events = relationship("CalendarEvent", back_populates="room")
    house_rules = relationship("HouseRule", back_populates="room")


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.MEMBER)
    generated_password = Column(String, nullable=True)  # Only for admin-invited members

    # Relationships
    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")
