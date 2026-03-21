from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.room import RoomMember
from app.models.message import Message

router = APIRouter()


class MessageCreate(BaseModel):
    room_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/{room_id}")
def get_messages(
    room_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check membership
    member = db.query(RoomMember).filter(
        RoomMember.room_id == room_id,
        RoomMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this room")

    query = db.query(Message).filter(Message.room_id == room_id)
    if before_id:
        query = query.filter(Message.id < before_id)

    messages = query.order_by(Message.created_at.desc()).limit(limit).all()

    return [
        MessageOut(
            id=m.id,
            room_id=m.room_id,
            user_id=m.user_id,
            user_name=m.user.name or "User",
            user_avatar=m.user.avatar_url,
            content=m.content,
            created_at=m.created_at,
        )
        for m in reversed(messages)
    ]


@router.post("/")
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check membership
    member = db.query(RoomMember).filter(
        RoomMember.room_id == data.room_id,
        RoomMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this room")

    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message = Message(
        room_id=data.room_id,
        user_id=current_user.id,
        content=data.content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return MessageOut(
        id=message.id,
        room_id=message.room_id,
        user_id=message.user_id,
        user_name=current_user.name or "User",
        user_avatar=current_user.avatar_url,
        content=message.content,
        created_at=message.created_at,
    )


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    db.delete(message)
    db.commit()
    return {"detail": "Message deleted"}
