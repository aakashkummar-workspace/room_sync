from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.api import deps
from app.models.note import Note
from app.models.user import User as UserModel

router = APIRouter()


class NoteCreate(BaseModel):
    room_id: int
    content: str
    color: Optional[str] = "#FFF9C4"


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    color: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class NoteOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    user_name: Optional[str] = None
    content: str
    color: str
    pos_x: float
    pos_y: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/{room_id}", response_model=List[NoteOut])
def get_room_notes(
    room_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    notes = db.query(Note).filter(Note.room_id == room_id).order_by(Note.created_at.desc()).all()
    result = []
    for note in notes:
        result.append(NoteOut(
            id=note.id,
            room_id=note.room_id,
            user_id=note.user_id,
            user_name=note.user.name if note.user else "Unknown",
            content=note.content,
            color=note.color,
            pos_x=note.pos_x or 0,
            pos_y=note.pos_y or 0,
            created_at=note.created_at,
        ))
    return result


@router.post("/", response_model=NoteOut)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    note = Note(
        room_id=note_in.room_id,
        user_id=current_user.id,
        content=note_in.content,
        color=note_in.color or "#FFF9C4",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteOut(
        id=note.id,
        room_id=note.room_id,
        user_id=note.user_id,
        user_name=current_user.name,
        content=note.content,
        color=note.color,
        pos_x=note.pos_x or 0,
        pos_y=note.pos_y or 0,
        created_at=note.created_at,
    )


@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.color is not None:
        note.color = note_in.color
    if note_in.pos_x is not None:
        note.pos_x = note_in.pos_x
    if note_in.pos_y is not None:
        note.pos_y = note_in.pos_y
    db.commit()
    db.refresh(note)
    return NoteOut(
        id=note.id,
        room_id=note.room_id,
        user_id=note.user_id,
        user_name=note.user.name if note.user else "Unknown",
        content=note.content,
        color=note.color,
        pos_x=note.pos_x or 0,
        pos_y=note.pos_y or 0,
        created_at=note.created_at,
    )


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}
