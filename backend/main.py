from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import hash_password
from database import Base, SessionLocal, engine
from models import Driver, User, Vehicle
from routes import analytics, auth, dashboard, drivers, expenses, maintenance, settings, trips, vehicles

def seed_data():
    db = SessionLocal()
    try:
        if not db.query(User).first():
            db.add_all([User(name="Fleet Manager", email="fleet@transitops.com", password_hash=hash_password("password123"), role="fleet_manager", department="Operations"), User(name="Dispatcher Dan", email="dispatch@transitops.com", password_hash=hash_password("password123"), role="dispatcher", department="Logistics"), User(name="Safety Sarah", email="safety@transitops.com", password_hash=hash_password("password123"), role="safety_officer", department="Safety"), User(name="Finance Frank", email="finance@transitops.com", password_hash=hash_password("password123"), role="financial_analyst", department="Finance")])
        if not db.query(Vehicle).first(): db.add_all([Vehicle(reg_no="VAN-01", name="Van-01", type="Van", capacity=800, odometer=12400, acq_cost=24000), Vehicle(reg_no="TRUCK-5", name="Truck-5", type="Truck", capacity=2000, odometer=56000, acq_cost=86000, status="On Trip"), Vehicle(reg_no="AU10-09", name="AU10-09", type="Van", capacity=900, odometer=3200, acq_cost=42000, status="In Shop"), Vehicle(reg_no="AU09-07", name="AU09-07", type="Truck", capacity=1500, odometer=28000, acq_cost=64000, status="Retired")])
        if not db.query(Driver).first(): db.add_all([Driver(name="Alex", license_id="DL-PP9G", category="LMV", expiry_date=date(2026, 10, 5), safety_score=99, contact="9876543210"), Driver(name="Dan", license_id="DL-MM42", category="LMV", expiry_date=date(2025, 5, 20), safety_score=88, contact="9876543211", status="On Trip"), Driver(name="Tom", license_id="DL-TT18", category="LMV", expiry_date=date(2026, 3, 15), safety_score=95, contact="9876543212", status="Off Duty"), Driver(name="Ravan", license_id="DL-MM46", category="LMV", expiry_date=date(2025, 10, 21), safety_score=72, contact="9876543213", status="Suspended")])
        db.commit()
    finally: db.close()

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine); seed_data(); yield

app = FastAPI(title="TransitOps API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content=exc.detail if isinstance(exc.detail, dict) else {"detail": exc.detail, "code": "HTTP_ERROR"})

for router in (auth.router, vehicles.router, drivers.router, trips.router, maintenance.router, expenses.router, analytics.router, dashboard.router, settings.router): app.include_router(router, prefix="/api")

@app.get("/health")
def health(): return {"status": "ok"}
