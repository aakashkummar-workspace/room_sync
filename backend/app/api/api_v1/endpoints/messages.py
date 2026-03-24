import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "uploads", "messages")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class MessageCreate(BaseModel):
    room_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    content: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


def _message_to_out(m, user_name=None, user_avatar=None):
    return MessageOut(
        id=m.id,
        room_id=m.room_id,
        user_id=m.user_id,
        user_name=user_name or (m.user.name if m.user else "User"),
        user_avatar=user_avatar or (m.user.avatar_url if m.user else None),
        content=m.content,
        attachment_url=m.attachment_url,
        attachment_type=m.attachment_type,
        attachment_name=m.attachment_name,
        created_at=m.created_at,
    )


@router.get("/{room_id}")
def get_messages(
    room_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    return [_message_to_out(m) for m in reversed(messages)]


@router.post("/")
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    return _message_to_out(message, current_user.name, current_user.avatar_url)


@router.post("/upload")
def send_message_with_file(
    room_id: int = Form(...),
    content: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(RoomMember).filter(
        RoomMember.room_id == room_id,
        RoomMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this room")

    # Save file
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    # Determine type
    image_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
    att_type = "image" if ext.lower() in image_exts else "file"

    message = Message(
        room_id=room_id,
        user_id=current_user.id,
        content=content.strip() if content else None,
        attachment_url=f"/uploads/messages/{filename}",
        attachment_type=att_type,
        attachment_name=file.filename,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return _message_to_out(message, current_user.name, current_user.avatar_url)


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
