from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthCode(BaseModel):
    code: str

DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_API_URL = "https://discord.com/api/users/@me"
DISCORD_GUILDS_URL = "https://discord.com/api/users/@me/guilds"

@app.post("/auth/discord")
async def discord_auth(data: AuthCode):
    code = data.code
    async with aiohttp.ClientSession() as session:
        payload = {
            "client_id": os.getenv("CLIENT_ID"),
            "client_secret": os.getenv("CLIENT_SECRET"),
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": os.getenv("REDIRECT_URI"),
        }

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        async with session.post(DISCORD_TOKEN_URL, data=payload, headers=headers) as resp:
            token_data = await resp.json()

        access_token = token_data.get("access_token")
        if not access_token:
            return {"error": "Invalid code or access token failed", "details": token_data}

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        async with session.get(DISCORD_API_URL, headers=headers) as resp_user:
            user = await resp_user.json()

        async with session.get(DISCORD_GUILDS_URL, headers=headers) as resp_guilds:
            guilds = await resp_guilds.json()

        return {
            "user": user,
            "guilds": guilds
        }