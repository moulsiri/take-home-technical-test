from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, ForgotPassword, ResetPassword
from app.api.deps import get_current_user, get_current_admin
from app.main import limiter
from app.services import auth_service

router = APIRouter()

@router.post("/register")
async def register(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_new_user(user_data, response, db)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    return await auth_service.authenticate_user(user_data, response, db)

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh_user_session(request.cookies.get("refreshToken"), response, db)

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "isVerified": current_user.is_verified,
    }

@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    return await auth_service.logout_user_session(request.cookies.get("refreshToken"), response, db)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    return await auth_service.trigger_forgot_password(data, db)

@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    return await auth_service.execute_reset_password(data, db)

@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await auth_service.verify_user_email(token, db)

@router.get("/admin-dashboard")
async def admin_dashboard(current_user: User = Depends(get_current_admin)):
    return {
        "message": "Welcome to the Admin Dashboard",
        "secretStats": {"active_users": 1420, "revenue": "$45,000"}
    }
