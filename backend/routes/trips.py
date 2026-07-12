import os
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import error, get_current_user, require_role
from models import Driver, ExpenseLog, Trip, User, Vehicle
from schemas import TripComplete, TripCreate, TripResponse

router = APIRouter(prefix="/trips", tags=["trips"])

def trip_or_404(db: Session, trip_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip: error(404, "Trip not found", "TRIP_NOT_FOUND")
    return trip

def validate_assignment(vehicle: Vehicle | None, driver: Driver | None, cargo_weight: float):
    from datetime import date
    if not vehicle: error(404, "Vehicle not found", "VEHICLE_NOT_FOUND")
    if not driver: error(404, "Driver not found", "DRIVER_NOT_FOUND")
    if vehicle.status != "Available": error(422, f"Vehicle is {vehicle.status}", "VEHICLE_UNAVAILABLE")
    if driver.status != "Available": error(422, f"Driver is {driver.status}", "DRIVER_UNAVAILABLE")
    if driver.expiry_date < date.today(): error(422, "License expired — cannot assign driver", "LICENSE_EXPIRED")
    if cargo_weight > float(vehicle.capacity): error(422, f"Cannot dispatch: cargo ({cargo_weight}kg) exceeds capacity ({vehicle.capacity}kg)", "CAPACITY_EXCEEDED")

@router.get("", response_model=list[TripResponse])
def list_trips(status: str | None = None, vehicle_id: int | None = None, driver_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(Trip)
    if status: query = query.filter(Trip.status == status)
    if vehicle_id: query = query.filter(Trip.vehicle_id == vehicle_id)
    if driver_id: query = query.filter(Trip.driver_id == driver_id)
    return query.order_by(Trip.created_at.desc()).all()

@router.post("", response_model=TripResponse, status_code=201)
def create_trip(body: TripCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager", "dispatcher"))):
    validate_assignment(db.get(Vehicle, body.vehicle_id), db.get(Driver, body.driver_id), body.cargo_weight)
    trip = Trip(**body.model_dump(), code="PENDING", created_by=current_user.id)
    db.add(trip); db.flush(); trip.code = f"TRIP{trip.id:04d}"; db.commit(); db.refresh(trip); return trip

@router.patch("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher"))):
    trip = trip_or_404(db, trip_id)
    if trip.status != "Draft": error(422, "Only draft trips can be dispatched", "INVALID_TRIP_STATE")
    validate_assignment(trip.vehicle, trip.driver, float(trip.cargo_weight))
    trip.status = "Dispatched"; trip.dispatched_at = datetime.utcnow(); trip.vehicle.status = "On Trip"; trip.driver.status = "On Trip"; db.commit(); db.refresh(trip); return trip

@router.patch("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(trip_id: int, body: TripComplete, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager", "dispatcher"))):
    trip = trip_or_404(db, trip_id)
    if trip.status != "Dispatched": error(422, "Only dispatched trips can be completed", "INVALID_TRIP_STATE")
    if body.final_odometer < float(trip.vehicle.odometer): error(422, "Final odometer cannot be lower than current odometer", "INVALID_ODOMETER")
    trip.actual_distance = body.final_odometer - float(trip.vehicle.odometer); trip.final_odometer = body.final_odometer; trip.fuel_consumed = body.fuel_consumed; trip.status = "Completed"; trip.completed_at = datetime.utcnow()
    trip.vehicle.odometer = body.final_odometer; trip.vehicle.status = "Available"; trip.driver.status = "Available"
    if body.fuel_consumed > 0: db.add(ExpenseLog(type="Fuel", vehicle_id=trip.vehicle_id, trip_id=trip.id, amount=body.fuel_consumed * float(os.getenv("FUEL_PRICE_PER_LITER", "100")), liters=body.fuel_consumed, description=f"Auto-created at completion of {trip.code}", created_by=current_user.id))
    db.commit(); db.refresh(trip); return trip

@router.patch("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher"))):
    trip = trip_or_404(db, trip_id)
    if trip.status not in ("Draft", "Dispatched"): error(422, "Only draft or dispatched trips can be cancelled", "INVALID_TRIP_STATE")
    trip.status = "Cancelled"; trip.cancelled_at = datetime.utcnow(); trip.vehicle.status = "Available"; trip.driver.status = "Available"; db.commit(); db.refresh(trip); return trip
