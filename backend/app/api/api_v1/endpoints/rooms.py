import secrets
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.schemas.room import Room, RoomCreate, RoomMember
from app.models.room import Room as RoomModel, RoomMember as RoomMemberModel, RoleEnum
from app.models.user import User

router = APIRouter()

def generate_invite_code(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for i in range(length))

@router.post("/create", response_model=Room)
def create_room(
    room_in: RoomCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    # Ensure generated code is unique
    while True:
        code = generate_invite_code()
        if not db.query(RoomModel).filter(RoomModel.invite_code == code).first():
            break

    room = RoomModel(
        name=room_in.name,
        invite_code=code,
        created_by=current_user.id
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # Add creator as admin
    member = RoomMemberModel(
        room_id=room.id,
        user_id=current_user.id,
        role=RoleEnum.ADMIN
    )
    db.add(member)
    db.commit()
    
    return room

@router.post("/join/{invite_code}", response_model=Room)
def join_room(
    invite_code: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    room = db.query(RoomModel).filter(RoomModel.invite_code == invite_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or invalid invite code")
    
    # Check if already a member
    existing_member = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room.id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    if existing_member:
        return room
        
    member = RoomMemberModel(
        room_id=room.id,
        user_id=current_user.id,
        role=RoleEnum.MEMBER
    )
    db.add(member)
    db.commit()
    return room

class InviteMemberRequest(BaseModel):
    email: str
    name: str = ""


class InviteMemberResponse(BaseModel):
    email: str
    password: str
    user_id: int
    message: str


@router.post("/{room_id}/invite", response_model=InviteMemberResponse)
def invite_member(
    room_id: int,
    request: InviteMemberRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Admin invites a new member by email. Auto-creates account with generated password."""
    # Check caller is admin of this room
    membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id,
        RoomMemberModel.role == RoleEnum.ADMIN,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()

    # Generate a random password
    generated_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))

    if existing_user:
        # User exists — just add to room if not already a member
        existing_membership = db.query(RoomMemberModel).filter(
            RoomMemberModel.room_id == room_id,
            RoomMemberModel.user_id == existing_user.id,
        ).first()
        if existing_membership:
            raise HTTPException(status_code=400, detail="User is already a member of this room")

        member = RoomMemberModel(room_id=room_id, user_id=existing_user.id, role=RoleEnum.MEMBER)
        db.add(member)
        db.commit()
        return InviteMemberResponse(
            email=existing_user.email,
            password="(existing account — use their current password)",
            user_id=existing_user.id,
            message=f"{existing_user.name} has been added to the room",
        )

    # Create new user
    from app.core.security import get_password_hash

    member_name = request.name or request.email.split("@")[0].title()
    new_user = User(
        email=request.email,
        name=member_name,
        password_hash=get_password_hash(generated_password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Add to room — store generated password so admin can view later
    member = RoomMemberModel(
        room_id=room_id,
        user_id=new_user.id,
        role=RoleEnum.MEMBER,
        generated_password=generated_password,
    )
    db.add(member)
    db.commit()

    return InviteMemberResponse(
        email=request.email,
        password=generated_password,
        user_id=new_user.id,
        message=f"Account created for {member_name}. Share the credentials!",
    )


@router.delete("/{room_id}/members/{user_id}")
def remove_member(
    room_id: int,
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Admin removes a member from the room."""
    # Check caller is admin
    admin_membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id,
        RoomMemberModel.role == RoleEnum.ADMIN,
    ).first()
    if not admin_membership:
        raise HTTPException(status_code=403, detail="Only admins can remove members")

    # Can't remove yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from the room")

    # Find and remove the member
    membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this room")

    db.delete(membership)
    db.commit()
    return {"ok": True, "message": f"Member {user_id} removed from room"}


from typing import Optional

class MemberCredential(BaseModel):
    user_id: int
    name: str
    email: str
    password: Optional[str] = None


@router.get("/{room_id}/credentials")
def get_member_credentials(
    room_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Admin-only: get login credentials for invited members."""
    admin_membership = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id,
        RoomMemberModel.role == RoleEnum.ADMIN,
    ).first()
    if not admin_membership:
        raise HTTPException(status_code=403, detail="Only admins can view credentials")

    memberships = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
    ).all()

    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append(MemberCredential(
                user_id=user.id,
                name=user.name,
                email=user.email,
                password=m.generated_password,
            ))
    return result


@router.get("/{room_id}", response_model=Room)
def get_room(
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
        
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    return room
