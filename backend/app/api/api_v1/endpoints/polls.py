from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/{room_id}", response_model=List[schemas.Poll])
def read_polls(
    room_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve polls for a specific room.
    """
    polls = db.query(models.Poll).filter(models.Poll.room_id == room_id).all()
    
    # Manually attach vote counts if needed or handle via schema
    return polls

@router.post("/", response_model=schemas.Poll)
def create_poll(
    *,
    db: Session = Depends(deps.get_db),
    poll_in: schemas.PollCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new poll with options.
    """
    poll = models.Poll(
        question=poll_in.question,
        room_id=poll_in.room_id,
        created_by=current_user.id
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)
    
    for option_text in poll_in.options:
        option = models.PollOption(poll_id=poll.id, option_text=option_text)
        db.add(option)
    
    db.commit()
    db.refresh(poll)
    return poll

@router.post("/vote", response_model=schemas.Poll)
def vote_poll(
    *,
    db: Session = Depends(deps.get_db),
    vote_in: schemas.VoteCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Vote for a poll option.
    """
    option = db.query(models.PollOption).filter(models.PollOption.id == vote_in.poll_option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")
    
    # Check if user already voted in this poll
    existing_vote = db.query(models.Vote).join(models.PollOption).filter(
        models.PollOption.poll_id == option.poll_id,
        models.Vote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update vote
        existing_vote.poll_option_id = vote_in.poll_option_id
    else:
        vote = models.Vote(poll_option_id=vote_in.poll_option_id, user_id=current_user.id)
        db.add(vote)
    
    db.commit()
    
    poll = db.query(models.Poll).filter(models.Poll.id == option.poll_id).first()
    return poll
