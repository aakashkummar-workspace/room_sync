from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.schemas.expense import Expense, ExpenseCreate
from app.models.expense import Expense as ExpenseModel, ExpenseSplit as ExpenseSplitModel
from app.models.room import RoomMember as RoomMemberModel
from app.models.user import User

router = APIRouter()

@router.post("/add", response_model=Expense)
def add_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    # Verify user is in the room
    membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == expense_in.room_id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this room")

    # Create expense
    expense = ExpenseModel(
        room_id=expense_in.room_id,
        title=expense_in.title,
        amount=expense_in.amount,
        category=expense_in.category,
        paid_by=current_user.id,
        attachment=expense_in.attachment
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Add splits
    for split_in in expense_in.splits:
        split = ExpenseSplitModel(
            expense_id=expense.id,
            user_id=split_in.user_id,
            amount_owed=split_in.amount_owed,
            is_paid=(split_in.user_id == current_user.id) # Payer is already paid
        )
        db.add(split)
    db.commit()
    db.refresh(expense)
    
    return expense

@router.get("/{room_id}", response_model=List[Expense])
def get_room_expenses(
    room_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    # Verify membership
    membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this room")
        
    expenses = db.query(ExpenseModel).filter(ExpenseModel.room_id == room_id).all()

    # Enrich with paid_by_name
    result = []
    for exp in expenses:
        exp_dict = {
            "id": exp.id,
            "room_id": exp.room_id,
            "title": exp.title,
            "amount": exp.amount,
            "category": exp.category,
            "attachment": exp.attachment,
            "paid_by": exp.paid_by,
            "paid_by_name": exp.payer.name if exp.payer else "Unknown",
            "created_at": exp.created_at,
            "splits": [
                {
                    "id": s.id,
                    "expense_id": s.expense_id,
                    "user_id": s.user_id,
                    "amount_owed": s.amount_owed,
                    "is_paid": s.is_paid,
                }
                for s in exp.splits
            ],
        }
        result.append(exp_dict)
    return result

@router.put("/splits/{split_id}/pay", response_model=Expense)
def settle_split(
    split_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    split = db.query(ExpenseSplitModel).filter(ExpenseSplitModel.id == split_id).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    
    # Only the person who owes the money can mark it as paid (or the person who is owed, but usually the receiver confirms)
    # Actually, usually the person who is OWED (paid_by) should mark it as received.
    # Let's check who the payer of the main expense is
    expense = split.expense
    if expense.paid_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the person who paid the expense can mark splits as settled")
    
    split.is_paid = True
    db.add(split)
    db.commit()
    db.refresh(expense)
    
    return expense
