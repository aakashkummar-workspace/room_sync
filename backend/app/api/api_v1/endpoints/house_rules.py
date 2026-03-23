from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.api import deps
from app.models.user import User
from app.models.room import RoomMember as RoomMemberModel, RoleEnum
from app.models.house_rules import HouseRule

router = APIRouter()


class HouseRuleCreate(BaseModel):
    room_id: int
    rule_text: str


class HouseRuleUpdate(BaseModel):
    rule_text: str


class HouseRuleOut(BaseModel):
    id: int
    room_id: int
    rule_text: str

    class Config:
        from_attributes = True


def _check_membership(db: Session, room_id: int, user_id: int):
    membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this room")
    return membership


@router.get("/{room_id}", response_model=List[HouseRuleOut])
def get_house_rules(
    room_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    _check_membership(db, room_id, current_user.id)
    rules = db.query(HouseRule).filter(HouseRule.room_id == room_id).all()
    return rules


@router.post("/", response_model=HouseRuleOut)
def create_house_rule(
    rule_in: HouseRuleCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    membership = _check_membership(db, rule_in.room_id, current_user.id)
    if membership.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can add rules")

    rule = HouseRule(room_id=rule_in.room_id, rule_text=rule_in.rule_text)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=HouseRuleOut)
def update_house_rule(
    rule_id: int,
    rule_in: HouseRuleUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    rule = db.query(HouseRule).filter(HouseRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    membership = _check_membership(db, rule.room_id, current_user.id)
    if membership.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can edit rules")

    rule.rule_text = rule_in.rule_text
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_house_rule(
    rule_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    rule = db.query(HouseRule).filter(HouseRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    membership = _check_membership(db, rule.room_id, current_user.id)
    if membership.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete rules")

    db.delete(rule)
    db.commit()
    return {"ok": True}
