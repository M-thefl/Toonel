from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import List
from pydantic import BaseModel
import requests
import os
from ..config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

class BotStatus(BaseModel):
    online: bool
    ping: int
    guilds: int
    users: int
    commands_used: int
    uptime: str

class CommandUsage(BaseModel):
    name: str
    count: int
    last_used: str

@router.get("/status", response_model=BotStatus)
async def get_bot_status(token: str = Depends(oauth2_scheme)):
    # In a real implementation, you would get this data from your bot
    return {
        "online": True,
        "ping": 42,
        "guilds": 10,
        "users": 2500,
        "commands_used": 1024,
        "uptime": "3 days, 5 hours"
    }

@router.get("/commands", response_model=List[CommandUsage])
async def get_command_usage(token: str = Depends(oauth2_scheme)):
    # In a real implementation, you would get this data from your bot
    return [
        {"name": "createconfig", "count": 512, "last_used": "2023-05-15T14:30:00"},
        {"name": "help", "count": 256, "last_used": "2023-05-15T14:25:00"},
        {"name": "ipinfo", "count": 128, "last_used": "2023-05-15T14:20:00"},
        {"name": "botinfo", "count": 128, "last_used": "2023-05-15T14:15:00"}
    ]