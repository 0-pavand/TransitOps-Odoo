from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class VehicleCreate(Schema):
    reg_no: str = Field(min_length=1, max_length=20)
    name: str
    type: Literal['Van', 'Truck', 'Bus', 'Bike', 'Other']
    capacity: float = Field(gt=0)
    odometer: float = Field(default=0, ge=0)
    acq_cost: float = Field(gt=0)
    region: Optional[str] = None


class VehicleUpdate(VehicleCreate):
    pass


class VehicleStatusUpdate(Schema):
    status: Literal['Available', 'On Trip', 'In Shop', 'Retired']


class VehicleResponse(Schema):
    id: int; reg_no: str; name: str; type: str; capacity: Decimal; odometer: Decimal; acq_cost: Decimal; status: str; region: Optional[str] = None; created_at: datetime


class DriverCreate(Schema):
    name: str; license_id: str; category: str; expiry_date: date; safety_score: float = Field(default=100, ge=0, le=100); contact: str


class DriverUpdate(DriverCreate):
    pass


class DriverStatusUpdate(Schema):
    status: Literal['Available', 'On Trip', 'Off Duty', 'Suspended']


class SafetyScoreUpdate(Schema):
    score: float = Field(ge=0, le=100)


class DriverResponse(Schema):
    id: int; name: str; license_id: str; category: str; expiry_date: date; safety_score: Decimal; contact: str; status: str; created_at: datetime; is_expired: bool = False; expires_soon: bool = False


class TripCreate(Schema):
    source: str; destination: str; vehicle_id: int; driver_id: int; cargo_weight: float = Field(gt=0); planned_distance: float = Field(gt=0)


class TripResponse(Schema):
    id: int; code: str; source: str; destination: str; vehicle_id: Optional[int]; driver_id: Optional[int]; cargo_weight: Decimal; planned_distance: Decimal; actual_distance: Optional[Decimal]; fuel_consumed: Optional[Decimal]; final_odometer: Optional[Decimal]; status: str; dispatched_at: Optional[datetime]; completed_at: Optional[datetime]; cancelled_at: Optional[datetime]; created_at: datetime


class TripComplete(Schema):
    final_odometer: float = Field(ge=0); fuel_consumed: float = Field(ge=0)


class MaintenanceCreate(Schema):
    vehicle_id: int; service_type: str; description: Optional[str] = None; mechanic: Optional[str] = None; est_cost: float = Field(default=0, ge=0)


class MaintenanceResponse(Schema):
    id: int; vehicle_id: int; service_type: str; description: Optional[str]; mechanic: Optional[str]; est_cost: Decimal; status: str; date_logged: datetime; resolved_at: Optional[datetime]


class ExpenseCreate(Schema):
    type: Literal['Fuel', 'Toll', 'Maintenance', 'Parking', 'Other']; vehicle_id: Optional[int] = None; trip_id: Optional[int] = None; amount: float = Field(gt=0); liters: Optional[float] = Field(default=None, gt=0); description: Optional[str] = None; date_logged: Optional[date] = None
    @field_validator('liters')
    @classmethod
    def liters_positive(cls, value): return value


class ExpenseResponse(Schema):
    id: int; type: str; vehicle_id: Optional[int]; trip_id: Optional[int]; amount: Decimal; liters: Optional[Decimal]; description: Optional[str]; date_logged: date; created_at: datetime


class LoginRequest(Schema):
    email: EmailStr; password: str = Field(min_length=1)


class UserResponse(Schema):
    id: int; name: str; email: EmailStr; role: str; department: Optional[str]; status: str


class LoginResponse(Schema):
    token: str; user: UserResponse


class UserCreate(Schema):
    name: str; email: EmailStr; password: str = Field(min_length=8); role: Literal['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']; department: Optional[str] = None


class UserUpdate(Schema):
    role: Optional[Literal['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']] = None; department: Optional[str] = None; status: Optional[Literal['active', 'inactive']] = None


def driver_response(driver) -> DriverResponse:
    today = date.today()
    return DriverResponse.model_validate(driver).model_copy(update={"is_expired": driver.expiry_date < today, "expires_soon": driver.expiry_date < today + timedelta(days=30)})
