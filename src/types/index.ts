export type Role = 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: 'Active' | 'Suspended';
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  type: string;
  capacity: number; // in kg
  odometer: number;
  acqCost: number;
  status: VehicleStatus;
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  licenseId: string;
  category: string;
  expiryDate: string; // ISO Date
  safetyScore: number;
  contact: string;
  status: DriverStatus;
}

export type TripStatus = 'Pending' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  code: string;
  route: {
    source: string;
    destination: string;
  };
  status: TripStatus;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  createdAt: string;
}

export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  mechanic: string;
  estCost: number;
  status: MaintenanceStatus;
  dateLogged: string;
}

export interface ExpenseLog {
  id: string;
  type: 'Fuel' | 'Other';
  vehicleId?: string;
  amount: number;
  description: string;
  dateLogged: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
}
