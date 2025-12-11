from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import List
from pydantic import BaseModel
from ..config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

class User(BaseModel):
    id: str
    username: str
    discriminator: str
    avatar: Optional[str]
    created_at: str
    is_bot: bool

class UserConfig(BaseModel):
    id: int
    user_id: str
    username: str
    size: str
    created_at: str
    expires_at: str
    status: str

@router.get("/", response_model=List[User])
async def get_users(token: str = Depends(oauth2_scheme)):
    return [
        {
            "id": "1234567890",
            "username": "TestUser",
            "discriminator": "1234",
            "avatar": None,
            "created_at": "2023-01-01T00:00:00",
            "is_bot": False
        }
    ]

@router.get("/configs", response_model=List[UserConfig])
async def get_user_configs(token: str = Depends(oauth2_scheme)):
    return [
        {
            "id": 1,
            "user_id": "1234567890",
            "username": "vpn_user1",
            "size": "1GB",
            "created_at": "2023-05-01T10:00:00",
            "expires_at": "2023-06-01T10:00:00",
            "status": "active"
        }
    ]