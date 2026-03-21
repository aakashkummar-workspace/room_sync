from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, rooms, expenses, chores, inventory, polls, dashboard, notes, messages

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(chores.router, prefix="/chores", tags=["chores"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(polls.router, prefix="/polls", tags=["polls"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
