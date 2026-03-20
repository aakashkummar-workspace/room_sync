import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RoomSync API"
    API_V1_STR: str = "/api/v1"

    # DATABASE — Supabase PostgreSQL
    DATABASE_URI: str = os.getenv(
        "DATABASE_URI",
        "postgresql://postgres.btoffumxzlhyundmfapc:Aakash%4012354@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    FACEBOOK_APP_ID: str = os.getenv("FACEBOOK_APP_ID", "")
    FACEBOOK_APP_SECRET: str = os.getenv("FACEBOOK_APP_SECRET", "")

settings = Settings()
