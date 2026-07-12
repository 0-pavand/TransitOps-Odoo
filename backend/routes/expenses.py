from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import error, require_role
from models import ExpenseLog, Trip, User, Vehicle
from schemas import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/total")
def total(year: int | None = None, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "financial_analyst"))):
    target_year = year or date.today().year
    rows = db.query(ExpenseLog.type, func.coalesce(func.sum(ExpenseLog.amount), 0)).filter(extract("year", ExpenseLog.date_logged) == target_year).group_by(ExpenseLog.type).all()
    totals = {kind: float(amount) for kind, amount in rows}
    fuel = totals.get("Fuel", 0.0); maintenance = totals.get("Maintenance", 0.0); other = sum(v for k, v in totals.items() if k not in {"Fuel", "Maintenance"})
    return {"fuel_total": fuel, "maintenance_total": maintenance, "other_total": other, "grand_total": fuel + maintenance + other, "year": target_year}

@router.get("", response_model=list[ExpenseResponse])
def list_expenses(vehicle_id: int | None = None, type: str | None = None, trip_id: int | None = None, year: int | None = None, db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher", "financial_analyst"))):
    query = db.query(ExpenseLog)
    if vehicle_id: query = query.filter(ExpenseLog.vehicle_id == vehicle_id)
    if type: query = query.filter(ExpenseLog.type == type)
    if trip_id: query = query.filter(ExpenseLog.trip_id == trip_id)
    if year: query = query.filter(extract("year", ExpenseLog.date_logged) == year)
    return query.order_by(ExpenseLog.date_logged.desc(), ExpenseLog.id.desc()).all()

@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(body: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("fleet_manager", "dispatcher", "financial_analyst"))):
    if body.type == "Fuel" and body.liters is None: error(422, "Liters are required for a fuel expense", "FUEL_LITERS_REQUIRED")
    if body.vehicle_id and not db.get(Vehicle, body.vehicle_id): error(404, "Vehicle not found", "VEHICLE_NOT_FOUND")
    if body.trip_id and not db.get(Trip, body.trip_id): error(404, "Trip not found", "TRIP_NOT_FOUND")
    data = body.model_dump(); data["date_logged"] = data["date_logged"] or date.today(); expense = ExpenseLog(**data, created_by=current_user.id); db.add(expense); db.commit(); db.refresh(expense); return expense
