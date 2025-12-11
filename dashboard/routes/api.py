from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/bot-stats")
async def get_bot_stats(request: Request):
    return JSONResponse({
        "uptime": "0 days, 0 hours",
        "guilds": 0,
        "commands": 0
    })

@router.get("/guilds")
async def get_guilds(request: Request):
    return JSONResponse({"guilds": []})