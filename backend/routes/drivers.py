from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from dependencies import error, require_role
from models import Driver, User
from schemas import DriverCreate, DriverResponse, DriverStatusUpdate, SafetyScoreUpdate, driver_response

router = APIRouter(prefix="/drivers", tags=["drivers"])

def driver_or_404(db: Session, driver_id: int) -> Driver:
    driver = db.get(Driver, driver_id)
    if not driver: error(404, "Driver not found", "DRIVER_NOT_FOUND")
    return driver

@router.get("/expiring", response_model=list[DriverResponse])
def expiring(db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "safety_officer"))):
    return [driver_response(d) for d in db.query(Driver).filter(Driver.expiry_date < date.today() + timedelta(days=30)).order_by(Driver.expiry_date).all()]

@router.get("", response_model=list[DriverResponse])
def list_drivers(status: Optional[str] = None, search: Optional[str] = None, expired: Optional[bool] = None, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher", "safety_officer"))):
    query = db.query(Driver)
    if status: query = query.filter(Driver.status == status)
    if search: query = query.filter(or_(Driver.name.ilike(f"%{search}%"), Driver.license_id.ilike(f"%{search}%")))
    if expired is True: query = query.filter(Driver.expiry_date < date.today())
    if expired is False: query = query.filter(Driver.expiry_date >= date.today())
    return [driver_response(d) for d in query.order_by(Driver.id).all()]

@router.post("", response_model=DriverResponse, status_code=201)
def create_driver(body: DriverCreate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "safety_officer"))):
    if db.query(Driver).filter(Driver.license_id == body.license_id).first(): error(409, "License ID already exists", "DUPLICATE_LICENSE")
    driver = Driver(**body.model_dump()); db.add(driver); db.commit(); db.refresh(driver); return driver_response(driver)

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher", "safety_officer"))): return driver_response(driver_or_404(db, driver_id))

@router.patch("/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: int, body: DriverCreate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "safety_officer"))):
    driver = driver_or_404(db, driver_id)
    duplicate = db.query(Driver).filter(Driver.license_id == body.license_id, Driver.id != driver_id).first()
    if duplicate: error(409, "License ID already exists", "DUPLICATE_LICENSE")
    for key, value in body.model_dump().items(): setattr(driver, key, value)
    db.commit(); db.refresh(driver); return driver_response(driver)

@router.patch("/{driver_id}/status", response_model=DriverResponse)
def update_status(driver_id: int, body: DriverStatusUpdate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "safety_officer"))):
    driver = driver_or_404(db, driver_id)
    if driver.status == "On Trip" and body.status == "Suspended": error(422, "Cannot suspend a driver on trip", "DRIVER_ON_TRIP")
    driver.status = body.status; db.commit(); db.refresh(driver); return driver_response(driver)

@router.patch("/{driver_id}/safety-score", response_model=DriverResponse)
def update_safety_score(driver_id: int, body: SafetyScoreUpdate, db: Session = Depends(get_db), _: User = Depends(require_role("safety_officer", "fleet_manager"))):
    driver = driver_or_404(db, driver_id); driver.safety_score = body.score; db.commit(); db.refresh(driver); return driver_response(driver)
