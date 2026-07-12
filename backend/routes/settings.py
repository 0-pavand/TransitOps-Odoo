from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import hash_password
from database import get_db
from dependencies import error, require_role
from models import User
from schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(tags=["settings"])

@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))): return db.query(User).order_by(User.id).all()

@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))):
    if db.query(User).filter(User.email == body.email.lower()).first(): error(409, "Email already exists", "DUPLICATE_EMAIL")
    user = User(**body.model_dump(exclude={"password"}), email=body.email.lower(), password_hash=hash_password(body.password)); db.add(user); db.commit(); db.refresh(user); return user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager"))):
    user = db.get(User, user_id)
    if not user: error(404, "User not found", "USER_NOT_FOUND")
    changes = body.model_dump(exclude_none=True)
    if user.id == current_user.id and "role" in changes: error(422, "Cannot change own role", "OWN_ROLE_CHANGE")
    for key, value in changes.items(): setattr(user, key, value)
    db.commit(); db.refresh(user); return user

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_role(user_id: int, body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager"))):
    if body.role is None: error(400, "Role is required", "ROLE_REQUIRED")
    return update_user(user_id, body, db, current_user)

@router.get("/settings/rbac")
def rbac(_: User = Depends(require_role("fleet_manager"))):
    return {"fleet_manager": ["*"], "dispatcher": ["dashboard", "fleet", "drivers", "trips", "expenses"], "safety_officer": ["dashboard", "drivers", "trips", "analytics"], "financial_analyst": ["dashboard", "expenses", "analytics"]}
