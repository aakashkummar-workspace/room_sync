import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.room import Room, RoomMember
from app.core.security import get_password_hash

def setup_test_user():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Clear existing test data
        db.query(User).filter(User.email == "user@casasync.com").delete()
        db.commit()

        # 2. Create User
        user = User(
            email="user@casasync.com",
            password_hash=get_password_hash("password123"),
            name="Rahul Kumar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 3. Create a default Room
        room = Room(
            name="The Printing House",
            invite_code="PRINT123",
            created_by=user.id
        )
        db.add(room)
        db.commit()
        db.refresh(room)

        # 4. Make User a Member (Admin)
        member = RoomMember(
            room_id=room.id,
            user_id=user.id,
            role="admin"
        )
        db.add(member)
        db.commit()

        print("Test User Created successfully!")
        print(f"Email: {user.email}")
        print("Password: password123")
        print(f"Room ID: {room.id}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_test_user()
