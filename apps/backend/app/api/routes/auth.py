from fastapi import APIRouter, Depends, Query, Request, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.models.user import User, RefreshToken
from app.schemas.auth import UserCreate, UserLogin, ForgotPassword, ResetPassword
from app.core.security import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, decode_access_token, decode_refresh_token,
    hash_token
)
# Assuming limiter is defined in main, we will just use dependency or limiter decorator. 
# A cleaner way using global Limiter:
from app.main import limiter

router = APIRouter()

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

def mock_send_email(to: str, subject: str, link: str):
    print(f"\n=== MOCK EMAIL ===\nTo: {to}\nSubject: {subject}\nLink: {link}\n==================\n")

@router.post("/register")
async def register(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")
        
    v_token = secrets.token_hex(16)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        verification_token=v_token
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    mock_send_email(user_data.email, "Verify your email", f"http://localhost:3000/verify-email?token={v_token}")
    
    # login automatically
    return await handle_login(new_user, response, db)

async def handle_login(user: User, response: Response, db: AsyncSession):
    payload = {"sub": user.id, "email": user.email, "role": user.role, "isVerified": user.is_verified}
    acc_token = create_access_token(payload)
    ref_token = create_refresh_token(payload)

    # store refresh token
    new_rt = RefreshToken(
        token_hash=hash_token(ref_token),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(new_rt)
    await db.commit()

    sec = os.getenv("NODE_ENV") == "production"
    response.set_cookie("accessToken", acc_token, httponly=True, samesite="lax", secure=sec, max_age=15*60)
    response.set_cookie("refreshToken", ref_token, httponly=True, samesite="lax", secure=sec, max_age=7*24*60*60)

    return {"message": "Success", "accessToken": acc_token, "refreshToken": ref_token}

import os

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return await handle_login(user, response, db)

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    ref_token = request.cookies.get("refreshToken")
    if not ref_token:
        raise HTTPException(status_code=401, detail="No refresh token")
        
    payload = decode_refresh_token(ref_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return await handle_login(user, response, db)

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
    ref_token = request.cookies.get("refreshToken")
    if ref_token:
        try:
            payload = decode_refresh_token(ref_token)
            if payload and payload.get("sub"):
                user_id = payload.get("sub")
                result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at == None))
                for rt in result.scalars().all():
                    rt.revoked_at = datetime.now(timezone.utc)
                await db.commit()
        except:
            pass # Suppress decode failures so we can aggressively clear bad cookies

    response.delete_cookie("accessToken")
    response.delete_cookie("refreshToken")
    return {"success": True}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If email exists, a reset link was sent."}
        
    token = secrets.token_hex(16)
    user.reset_password_token = token
    user.reset_password_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.commit()
    
    mock_send_email(data.email, "Reset Password", f"http://localhost:3000/reset-password?token={token}")
    return {"message": "If email exists, a reset link was sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.reset_password_token == data.token,
            User.reset_password_expires > datetime.now(timezone.utc)
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired reset token")
        
    user.password_hash = hash_password(data.password)
    user.reset_password_token = None
    user.reset_password_expires = None
    await db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid verification token")
        
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email verified successfully"}
