from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "Discord Bot Dashboard"
    admin_email: str = "admin@example.com"
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    database_url: str = "sqlite:///./dashboard.db"
    
    class Config:
        env_file = ".env"

settings = Settings()