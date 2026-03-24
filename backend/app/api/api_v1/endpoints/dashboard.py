from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get aggregated dashboard data for the current user.
    """
    # 1. Basic User Info
    user_name = current_user.name.split()[0] if current_user.name else "Friend"

    # 2. Find User's Room (assuming one room for now for simplicity)
    room_member = db.query(models.RoomMember).filter(models.RoomMember.user_id == current_user.id).first()
    if not room_member:
        # Return empty/default dashboard if no room
        return {
            "user_name": user_name,
            "pending_chores_count": 0,
            "unsettled_bills_count": 0,
            "stats": [],
            "recent_activity": []
        }
    
    room_id = room_member.room_id

    # 3. Pending Chores Count
    pending_chores_count = db.query(models.Chore).filter(
        models.Chore.room_id == room_id,
        models.Chore.assigned_to == current_user.id,
        models.Chore.status == "pending"
    ).count()

    # 4. Unsettled Bills (Debt)
    # Amount current user owes to others
    unsettled_splits = db.query(models.ExpenseSplit).filter(
        models.ExpenseSplit.user_id == current_user.id,
        models.ExpenseSplit.is_paid == False
    ).all()
    unsettled_bills_count = len(unsettled_splits)
    total_debt = sum(split.amount_owed for split in unsettled_splits)

    # 5. Monthly Spending (Amount user paid this month)
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_spending = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.paid_by == current_user.id,
        models.Expense.created_at >= first_day_of_month
    ).scalar() or 0

    # 5b. Total Room Expenses this month (all members)
    total_room_expenses = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.room_id == room_id,
        models.Expense.created_at >= first_day_of_month
    ).scalar() or 0

    # 6. Inventory Alerts
    inventory_alerts = db.query(models.InventoryItem).filter(
        models.InventoryItem.room_id == room_id,
        models.InventoryItem.quantity <= models.InventoryItem.min_quantity
    ).count()

    # 7. Recent Activity (Mix of Expenses and Chores)
    recent_activity = []
    
    # Last 5 expenses
    expenses = db.query(models.Expense).filter(
        models.Expense.room_id == room_id
    ).order_by(models.Expense.created_at.desc()).limit(5).all()
    
    for exp in expenses:
        # Format time (simplified)
        recent_activity.append({
            "id": exp.id,
            "type": "expense",
            "title": exp.title,
            "amount": exp.amount,
            "user": exp.payer.name.split()[0] if exp.payer else "User",
            "time": "Today" # Needs real helper for "2h ago" etc
        })

    # 8. Room info
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    room_name = room.name if room else "My Room"
    invite_code = room.invite_code if room else ""

    # 9. Room Members for splitting (include email, phone, role)
    member_records = db.query(models.User, models.RoomMember).join(
        models.RoomMember, models.RoomMember.user_id == models.User.id
    ).filter(
        models.RoomMember.room_id == room_id
    ).all()
    room_members = [
        {
            "id": m.User.id,
            "name": m.User.name,
            "email": m.User.email,
            "phone": m.User.phone,
            "role": m.RoomMember.role.value if m.RoomMember.role else "member",
        }
        for m in member_records
    ]

    # 10. Stats List
    stats = [
        {"title": "Total Balance", "value": f"₹{int(total_debt)}", "trend": -5, "color": "bg-brand-emerald", "icon": "TrendingDown"},
        {"title": "Monthly Spending", "value": f"₹{int(monthly_spending)}", "trend": 12, "color": "bg-red-500", "icon": "TrendingUp"},
        {"title": "Pending Chores", "value": f"{pending_chores_count}", "color": "bg-brand-midnight", "icon": "Clock"},
        {"title": "Inventory Alerts", "value": f"{inventory_alerts}", "color": "bg-orange-500", "icon": "AlertTriangle"}
    ]

    return {
        "user_name": user_name,
        "room_id": room_id,
        "room_name": room_name,
        "invite_code": invite_code,
        "pending_chores_count": pending_chores_count,
        "unsettled_bills_count": unsettled_bills_count,
        "total_room_expenses": int(total_room_expenses),
        "stats": stats,
        "recent_activity": recent_activity,
        "room_members": room_members
    }
