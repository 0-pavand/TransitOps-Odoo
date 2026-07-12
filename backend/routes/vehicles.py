from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from dependencies import error, get_current_user, require_role
from models import MaintenanceLog, User, Vehicle
from schemas import VehicleCreate, VehicleResponse, VehicleStatusUpdate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

def vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle: error(404, "Vehicle not found", "VEHICLE_NOT_FOUND")
    return vehicle

@router.get("", response_model=list[VehicleResponse])
def list_vehicles(type: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(Vehicle)
    if type: query = query.filter(Vehicle.type == type)
    if status: query = query.filter(Vehicle.status == status)
    if search: query = query.filter(or_(Vehicle.reg_no.ilike(f"%{search}%"), Vehicle.name.ilike(f"%{search}%")))
    return query.order_by(Vehicle.id).all()

@router.post("", response_model=VehicleResponse, status_code=201)
def create_vehicle(body: VehicleCreate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))):
    if db.query(Vehicle).filter(Vehicle.reg_no == body.reg_no).first(): error(409, "Registration number already exists", "DUPLICATE_REGISTRATION")
    vehicle = Vehicle(**body.model_dump()); db.add(vehicle); db.commit(); db.refresh(vehicle); return vehicle

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)): return vehicle_or_404(db, vehicle_id)

@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, body: VehicleCreate, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))):
    vehicle = vehicle_or_404(db, vehicle_id)
    duplicate = db.query(Vehicle).filter(Vehicle.reg_no == body.reg_no, Vehicle.id != vehicle_id).first()
    if duplicate: error(409, "Registration number already exists", "DUPLICATE_REGISTRATION")
    for key, value in body.model_dump().items(): setattr(vehicle, key, value)
    db.commit(); db.refresh(vehicle); return vehicle

@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_status(vehicle_id: int, body: VehicleStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager", "dispatcher"))):
    vehicle = vehicle_or_404(db, vehicle_id)
    if vehicle.status == "On Trip" and body.status != "On Trip": error(422, "Cannot change a vehicle that is on trip outside trip completion or cancellation", "VEHICLE_ON_TRIP")
    if body.status == "In Shop" and vehicle.status != "In Shop": db.add(MaintenanceLog(vehicle_id=vehicle.id, service_type="Status change", description="Vehicle moved to In Shop", created_by=current_user.id))
    if body.status == "Available":
        for log in db.query(MaintenanceLog).filter(MaintenanceLog.vehicle_id == vehicle.id, MaintenanceLog.status == "In Shop").all():
            log.status = "Resolved"
            from datetime import datetime
            log.resolved_at = datetime.utcnow()
    vehicle.status = body.status; db.commit(); db.refresh(vehicle); return vehicle

@router.delete("/{vehicle_id}", response_model=VehicleResponse)
def retire_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))):
    vehicle = vehicle_or_404(db, vehicle_id)
    if vehicle.status == "On Trip": error(422, "Cannot retire a vehicle on trip", "VEHICLE_ON_TRIP")
    vehicle.status = "Retired"; db.commit(); db.refresh(vehicle); return vehicle
