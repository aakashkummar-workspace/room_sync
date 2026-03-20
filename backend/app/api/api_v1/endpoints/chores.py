from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/{room_id}", response_model=List[schemas.Chore])
def read_chores(
    room_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve chores for a specific room.
    """
    chores = db.query(models.Chore).filter(models.Chore.room_id == room_id).all()
    return chores

@router.post("/create", response_model=schemas.Chore)
def create_chore(
    *,
    db: Session = Depends(deps.get_db),
    chore_in: schemas.ChoreCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new chore.
    """
    chore_data = chore_in.model_dump()
    # Use the assigned_to from the form, fall back to current user
    if not chore_data.get("assigned_to"):
        chore_data["assigned_to"] = current_user.id
    chore = models.Chore(**chore_data)
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return chore

@router.patch("/{chore_id}/status", response_model=schemas.Chore)
def update_chore_status(
    *,
    db: Session = Depends(deps.get_db),
    chore_id: int,
    status_in: schemas.ChoreUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update chore status.
    """
    chore = db.query(models.Chore).filter(models.Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    
    chore.status = status_in.status
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return chore
