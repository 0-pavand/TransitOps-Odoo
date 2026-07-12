from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from database import get_db
from dependencies import get_current_user
from models import Driver, ExpenseLog, Trip, User, Vehicle

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpis")
def kpis(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle); drivers = db.query(Driver); trips = db.query(Trip)
    active_trips = trips.filter(Trip.status == "Dispatched").count()
    total = vehicles.count(); utilization = round(vehicles.filter(Vehicle.status == "On Trip").count() / total * 100, 2) if total else 0
    if user.role in ("fleet_manager", "dispatcher"):
        return {"active_vehicles": vehicles.filter(Vehicle.status == "On Trip").count(), "available_vehicles": vehicles.filter(Vehicle.status == "Available").count(), "in_maintenance": vehicles.filter(Vehicle.status == "In Shop").count(), "active_trips": active_trips, "pending_trips": trips.filter(Trip.status == "Draft").count(), "drivers_on_duty": drivers.filter(Driver.status == "On Trip").count(), "fleet_utilization": utilization}
    if user.role == "safety_officer":
        return {"drivers_on_duty": drivers.filter(Driver.status == "On Trip").count(), "available_drivers": drivers.filter(Driver.status == "Available").count(), "suspended_drivers": drivers.filter(Driver.status == "Suspended").count(), "expiring_licenses": drivers.filter(Driver.expiry_date < date.today()).count(), "active_trips": active_trips}
    fuel_today = db.query(func.coalesce(func.sum(ExpenseLog.amount), 0)).filter(ExpenseLog.type == "Fuel", ExpenseLog.date_logged == date.today()).scalar()
    all_expenses = db.query(func.coalesce(func.sum(ExpenseLog.amount), 0)).scalar()
    return {"total_operational_cost": float(all_expenses), "fuel_cost_today": float(fuel_today), "fleet_utilization": utilization, "active_trips": active_trips}

@router.get("/recent-trips")
def recent_trips(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    trips = db.query(Trip).options(joinedload(Trip.vehicle), joinedload(Trip.driver)).order_by(Trip.created_at.desc()).limit(5).all()
    return [{"id": trip.id, "code": trip.code, "source": trip.source, "destination": trip.destination, "status": trip.status, "vehicle_reg_no": trip.vehicle.reg_no if trip.vehicle else None, "driver_name": trip.driver.name if trip.driver else None, "created_at": trip.created_at} for trip in trips]

@router.get("/vehicle-status")
def vehicle_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    counts = dict(db.query(Vehicle.status, func.count(Vehicle.id)).group_by(Vehicle.status).all())
    return {"available": counts.get("Available", 0), "on_trip": counts.get("On Trip", 0), "in_shop": counts.get("In Shop", 0), "retired": counts.get("Retired", 0)}
