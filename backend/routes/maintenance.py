from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import error, require_role
from models import MaintenanceLog, User, Vehicle
from schemas import MaintenanceCreate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

def log_or_404(db: Session, log_id: int):
    log = db.get(MaintenanceLog, log_id)
    if not log: error(404, "Maintenance log not found", "MAINTENANCE_NOT_FOUND")
    return log

@router.get("", response_model=list[MaintenanceResponse])
def list_logs(vehicle_id: int | None = None, status: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher", "financial_analyst", "safety_officer"))):
    query = db.query(MaintenanceLog)
    if vehicle_id: query = query.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if status: query = query.filter(MaintenanceLog.status == status)
    return query.order_by(MaintenanceLog.date_logged.desc()).all()

@router.post("", response_model=MaintenanceResponse, status_code=201)
def create_log(body: MaintenanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager"))):
    vehicle = db.get(Vehicle, body.vehicle_id)
    if not vehicle: error(404, "Vehicle not found", "VEHICLE_NOT_FOUND")
    if vehicle.status == "On Trip": error(422, "Cannot put vehicle in maintenance while on trip", "VEHICLE_ON_TRIP")
    log = MaintenanceLog(**body.model_dump(), created_by=current_user.id); vehicle.status = "In Shop"; db.add(log); db.commit(); db.refresh(log); return log

@router.patch("/{log_id}/resolve", response_model=MaintenanceResponse)
def resolve_log(log_id: int, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager"))):
    log = log_or_404(db, log_id); log.status = "Resolved"; log.resolved_at = datetime.utcnow()
    if log.vehicle.status != "Retired": log.vehicle.status = "Available"
    db.commit(); db.refresh(log); return log
