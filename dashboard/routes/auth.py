from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import os

router = APIRouter()

# OAuth configuration
config = Config('.env')
oauth = OAuth(config)

oauth.register(
    name='discord',
    client_id=os.getenv('DISCORD_CLIENT_ID'),
    client_secret=os.getenv('DISCORD_CLIENT_SECRET'),
    authorize_url='https://discord.com/api/oauth2/authorize',
    access_token_url='https://discord.com/api/oauth2/token',
    redirect_uri=os.getenv('DISCORD_REDIRECT_URI'),
    client_kwargs={'scope': 'identify guilds'},
)

@router.get('/login')
async def login(request: Request):
    redirect_uri = request.url_for('auth_callback')
    return await oauth.discord.authorize_redirect(request, redirect_uri)

@router.get('/callback')
async def auth_callback(request: Request):
    try:
        token = await oauth.discord.authorize_access_token(request)
        user = await oauth.discord.parse_id_token(request, token)
        request.session['user'] = user
        return RedirectResponse(url='/')
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/logout')
async def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url='/')

@router.get('/check')
async def check_auth(request: Request):
    user = request.session.get('user')
    if user:
        return {
            "authenticated": True,
            "user": {
                "username": user.get('username'),
                "avatar": user.get('avatar')
            }
        }
    return {"authenticated": False}