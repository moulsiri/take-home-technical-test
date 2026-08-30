from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.core.security import decode_access_token

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

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if getattr(current_user.role, "value", current_user.role) != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized, admin access required")
    return current_user
