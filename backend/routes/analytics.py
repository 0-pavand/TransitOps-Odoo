import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_role
from models import ExpenseLog, MaintenanceLog, Trip, User, Vehicle

router = APIRouter(prefix="/analytics", tags=["analytics"])

def summaries(db: Session):
    result = []
    for vehicle in db.query(Vehicle).order_by(Vehicle.id).all():
        fuel = float(db.query(func.coalesce(func.sum(ExpenseLog.amount), 0)).filter(ExpenseLog.vehicle_id == vehicle.id, ExpenseLog.type == "Fuel").scalar())
        maintenance = float(db.query(func.coalesce(func.sum(MaintenanceLog.est_cost), 0)).filter(MaintenanceLog.vehicle_id == vehicle.id).scalar())
        distance, consumed = db.query(func.coalesce(func.sum(Trip.actual_distance), 0), func.coalesce(func.sum(Trip.fuel_consumed), 0)).filter(Trip.vehicle_id == vehicle.id, Trip.status == "Completed").one()
        distance, consumed = float(distance), float(consumed)
        result.append({"id": vehicle.id, "reg_no": vehicle.reg_no, "name": vehicle.name, "acq_cost": float(vehicle.acq_cost), "status": vehicle.status, "total_fuel_cost": fuel, "total_maintenance_cost": maintenance, "total_operational_cost": fuel + maintenance, "total_distance": distance, "total_fuel_consumed": consumed, "fuel_efficiency": round(distance / consumed, 2) if consumed else 0})
    return result

@router.get("/fuel-efficiency")
def fuel_efficiency(db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "financial_analyst", "safety_officer"))):
    vehicles = summaries(db); eligible = [v["fuel_efficiency"] for v in vehicles if v["total_fuel_consumed"] > 0]
    return {"vehicles": vehicles, "overall_average": round(sum(eligible) / len(eligible), 2) if eligible else 0}

@router.get("/fleet-utilization")
def fleet_utilization(db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "dispatcher", "safety_officer", "financial_analyst"))):
    total = db.query(func.count(Vehicle.id)).scalar() or 0; active = db.query(func.count(Vehicle.id)).filter(Vehicle.status == "On Trip").scalar() or 0
    return {"utilization_pct": round(active / total * 100, 2) if total else 0, "active": active, "total": total}

@router.get("/operational-cost")
def operational_cost(db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "financial_analyst", "safety_officer"))): return sorted(summaries(db), key=lambda row: row["total_operational_cost"], reverse=True)

@router.get("/vehicle-roi")
def vehicle_roi(revenue: float = Query(default=0, ge=0), db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "financial_analyst"))):
    return [{**row, "revenue": revenue, "roi_pct": round((revenue - row["total_operational_cost"]) / row["acq_cost"] * 100, 2) if row["acq_cost"] else 0} for row in summaries(db)]

@router.get("/export")
def export(format: str = Query("csv", pattern="^(csv|pdf)$"), db: Session = Depends(get_db), _: User = Depends(require_role("fleet_manager", "financial_analyst"))):
    if format != "csv": return StreamingResponse(io.BytesIO(b"PDF export is not configured; request CSV."), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=vehicle-cost-summary.pdf"})
    rows = summaries(db); output = io.StringIO(); writer = csv.DictWriter(output, fieldnames=list(rows[0]) if rows else ["id", "reg_no", "name"]); writer.writeheader(); writer.writerows(rows)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=vehicle-cost-summary.csv"})
