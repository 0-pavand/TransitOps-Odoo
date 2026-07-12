from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import create_access_token, verify_password
from database import get_db
from dependencies import error, get_current_user
from models import User
from schemas import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash): error(401, "Invalid credentials", "INVALID_CREDENTIALS")
    if user.status != "active": error(403, "User is inactive", "INACTIVE_USER")
    return {"token": create_access_token({"sub": str(user.id), "role": user.role}), "user": user}

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)): return current_user

@router.post("/logout")
def logout(): return {"message": "Logged out"}
