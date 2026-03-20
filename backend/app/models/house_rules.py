from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class HouseRule(Base):
    __tablename__ = "house_rules"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    rule_text = Column(String, nullable=False)

    # Relationships
    room = relationship("Room", back_populates="house_rules")
