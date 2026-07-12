from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('fleet_manager','dispatcher','safety_officer','financial_analyst')"), CheckConstraint("status IN ('active','inactive')"))
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    trips_created: Mapped[list[Trip]] = relationship(back_populates="creator", foreign_keys="Trip.created_by")
    def __repr__(self): return f"<User {self.email}>"


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (CheckConstraint("type IN ('Van','Truck','Bus','Bike','Other')"), CheckConstraint("capacity > 0"), CheckConstraint("status IN ('Available','On Trip','In Shop','Retired')"))
    id: Mapped[int] = mapped_column(primary_key=True)
    reg_no: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(30), index=True)
    capacity: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    odometer: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    acq_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), default="Available", index=True)
    region: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    trips: Mapped[list[Trip]] = relationship(back_populates="vehicle")
    maintenance_logs: Mapped[list[MaintenanceLog]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    expenses: Mapped[list[ExpenseLog]] = relationship(back_populates="vehicle")
    def __repr__(self): return f"<Vehicle {self.reg_no}>"


class Driver(Base):
    __tablename__ = "drivers"
    __table_args__ = (CheckConstraint("safety_score >= 0 AND safety_score <= 100"), CheckConstraint("status IN ('Available','On Trip','Off Duty','Suspended')"))
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    license_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(20))
    expiry_date: Mapped[date] = mapped_column(Date, index=True)
    safety_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=100)
    contact: Mapped[str] = mapped_column(String(15))
    status: Mapped[str] = mapped_column(String(20), default="Available", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    trips: Mapped[list[Trip]] = relationship(back_populates="driver")
    def __repr__(self): return f"<Driver {self.license_id}>"


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (CheckConstraint("cargo_weight > 0"), CheckConstraint("status IN ('Draft','Dispatched','Completed','Cancelled')"))
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    vehicle_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vehicles.id"))
    driver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("drivers.id"))
    source: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    cargo_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    planned_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    actual_distance: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    fuel_consumed: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    final_odometer: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20), default="Draft", index=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    vehicle: Mapped[Optional[Vehicle]] = relationship(back_populates="trips")
    driver: Mapped[Optional[Driver]] = relationship(back_populates="trips")
    creator: Mapped[Optional[User]] = relationship(back_populates="trips_created", foreign_keys=[created_by])
    expenses: Mapped[list[ExpenseLog]] = relationship(back_populates="trip")
    def __repr__(self): return f"<Trip {self.code}>"


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    __table_args__ = (CheckConstraint("status IN ('In Shop','Resolved')"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    service_type: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    mechanic: Mapped[Optional[str]] = mapped_column(String(100))
    est_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[str] = mapped_column(String(20), default="In Shop")
    date_logged: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    vehicle: Mapped[Vehicle] = relationship(back_populates="maintenance_logs")
    def __repr__(self): return f"<MaintenanceLog {self.id}>"


class ExpenseLog(Base):
    __tablename__ = "expense_logs"
    __table_args__ = (CheckConstraint("type IN ('Fuel','Toll','Maintenance','Parking','Other')"), CheckConstraint("amount > 0"))
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(30))
    vehicle_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vehicles.id"), index=True)
    trip_id: Mapped[Optional[int]] = mapped_column(ForeignKey("trips.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    liters: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    description: Mapped[Optional[str]] = mapped_column(Text)
    date_logged: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    vehicle: Mapped[Optional[Vehicle]] = relationship(back_populates="expenses")
    trip: Mapped[Optional[Trip]] = relationship(back_populates="expenses")
    def __repr__(self): return f"<ExpenseLog {self.id}>"
