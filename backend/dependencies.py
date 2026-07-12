from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from auth import decode_token
from database import get_db
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def error(status_code: int, detail: str, code: str):
    raise HTTPException(status_code=status_code, detail={"detail": detail, "code": code})

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try: payload = decode_token(token); user_id = payload.get("sub")
    except ValueError: error(401, "Token expired or invalid", "INVALID_TOKEN")
    user = db.get(User, int(user_id)) if user_id else None
    if not user: error(401, "Not authenticated", "NOT_AUTHENTICATED")
    if user.status != "active": error(403, "User is inactive", "INACTIVE_USER")
    return user

def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles: error(403, f"Access denied for role: {current_user.role}", "ACCESS_DENIED")
        return current_user
    return checker
