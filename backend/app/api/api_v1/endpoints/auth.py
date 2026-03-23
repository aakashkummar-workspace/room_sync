import os
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx

from app.core import security
from app.core.config import settings
from app.api import deps
from app.schemas.user import UserCreate, User, UserUpdate
from app.schemas.token import Token
from app.models.user import User as UserModel

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
UPLOAD_DIR = os.path.join(BACKEND_ROOT, "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    credential: str


class FacebookLoginRequest(BaseModel):
    access_token: str

@router.post("/signup", response_model=User)
def signup(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    user = UserModel(
        email=user_in.email,
        name=user_in.name,
        password_hash=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
):
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def _create_token_for_user(user_id: int) -> dict:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


def _get_or_create_oauth_user(db: Session, email: str, name: str, provider: str, provider_id: str, avatar_url: str = None):
    """Find existing user by email or provider ID, or create a new one."""
    user = db.query(UserModel).filter(UserModel.email == email).first()

    if user:
        # Link provider ID if not already linked
        if provider == "google" and not user.google_id:
            user.google_id = provider_id
        elif provider == "facebook" and not user.facebook_id:
            user.facebook_id = provider_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

    # Create new user (no password needed for OAuth)
    user = UserModel(
        email=email,
        name=name,
        password_hash="",
        google_id=provider_id if provider == "google" else None,
        facebook_id=provider_id if provider == "facebook" else None,
        avatar_url=avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/google", response_model=Token)
async def google_login(
    request: GoogleLoginRequest,
    db: Session = Depends(deps.get_db),
):
    """Verify Google token (access_token or id_token) and login/register the user."""
    try:
        async with httpx.AsyncClient() as client:
            # Try as access_token first (from useGoogleLogin), fall back to id_token
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {request.credential}"},
            )
            if resp.status_code != 200:
                # Fall back: try as id_token
                resp = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={request.credential}"
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Invalid Google token")
            payload = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify Google token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = _get_or_create_oauth_user(
        db=db,
        email=email,
        name=payload.get("name", email.split("@")[0]),
        provider="google",
        provider_id=payload.get("sub"),
        avatar_url=payload.get("picture"),
    )
    return _create_token_for_user(user.id)


@router.post("/facebook", response_model=Token)
async def facebook_login(
    request: FacebookLoginRequest,
    db: Session = Depends(deps.get_db),
):
    """Verify Facebook access token and login/register the user."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://graph.facebook.com/me",
                params={
                    "fields": "id,name,email,picture.type(large)",
                    "access_token": request.access_token,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Facebook token")
            payload = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to verify Facebook token")

    email = payload.get("email")
    fb_id = payload.get("id")
    if not email:
        # Some FB accounts don't share email — use a fallback
        email = f"{fb_id}@facebook.com"

    avatar_url = payload.get("picture", {}).get("data", {}).get("url")

    user = _get_or_create_oauth_user(
        db=db,
        email=email,
        name=payload.get("name", "Facebook User"),
        provider="facebook",
        provider_id=fb_id,
        avatar_url=avatar_url,
    )
    return _create_token_for_user(user.id)


@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(deps.get_current_user),
):
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    if user_in.name is not None:
        current_user.name = user_in.name
    if user_in.phone is not None:
        current_user.phone = user_in.phone
    if user_in.avatar_url is not None:
        current_user.avatar_url = user_in.avatar_url

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")

    name = file.filename or "avatar.jpg"
    ext = name.rsplit(".", 1)[-1] if "." in name else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": avatar_url}
