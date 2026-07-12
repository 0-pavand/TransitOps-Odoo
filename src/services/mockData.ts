import { User, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Alice Manager', email: 'fleet@transitops.com', role: 'fleet_manager', department: 'Management', status: 'Active' },
  { id: '2', name: 'Bob Dispatcher', email: 'dispatch@transitops.com', role: 'dispatcher', department: 'Operations', status: 'Active' },
  { id: '3', name: 'Charlie Safety', email: 'safety@transitops.com', role: 'safety_officer', department: 'Compliance', status: 'Active' },
  { id: '4', name: 'Diana Finance', email: 'finance@transitops.com', role: 'financial_analyst', department: 'Finance', status: 'Active' }
];

export const mockVehicles: Vehicle[] = [
  { id: 'v1', regNo: 'TRK-1001', name: 'Volvo FH16', type: 'Heavy Duty', capacity: 20000, odometer: 150000, acqCost: 120000, status: 'Available' },
  { id: 'v2', regNo: 'TRK-1002', name: 'Scania R500', type: 'Heavy Duty', capacity: 18000, odometer: 210000, acqCost: 110000, status: 'On Trip' },
  { id: 'v3', regNo: 'VAN-2001', name: 'Ford Transit', type: 'Light Van', capacity: 3000, odometer: 45000, acqCost: 35000, status: 'In Shop' },
  { id: 'v4', regNo: 'TRK-1003', name: 'Volvo FH16', type: 'Heavy Duty', capacity: 20000, odometer: 500000, acqCost: 115000, status: 'Retired' }
];

export const mockDrivers: Driver[] = [
  { id: 'd1', name: 'John Doe', licenseId: 'DL-12345', category: 'Class A', expiryDate: '2028-10-15', safetyScore: 95, contact: '+1234567890', status: 'Available' },
  { id: 'd2', name: 'Jane Smith', licenseId: 'DL-67890', category: 'Class A', expiryDate: '2027-05-20', safetyScore: 82, contact: '+1987654321', status: 'On Trip' },
  { id: 'd3', name: 'Mike Johnson', licenseId: 'DL-11111', category: 'Class B', expiryDate: '2026-08-10', safetyScore: 99, contact: '+1122334455', status: 'Available' },
  { id: 'd4', name: 'Sarah Connor', licenseId: 'DL-99999', category: 'Class A', expiryDate: '2024-03-01', safetyScore: 65, contact: '+1555555555', status: 'Suspended' },
  { id: 'd5', name: 'David Miller', licenseId: 'DL-55555', category: 'Class A', expiryDate: '2028-04-12', safetyScore: 92, contact: '+1777888999', status: 'Available' },
  { id: 'd6', name: 'Robert Chen', licenseId: 'DL-77777', category: 'Class B', expiryDate: '2028-09-20', safetyScore: 88, contact: '+1444555666', status: 'Available' },
  { id: 'd7', name: 'Marcus Aurelius', licenseId: 'DL-88888', category: 'Class A', expiryDate: '2025-01-01', safetyScore: 78, contact: '+1333444555', status: 'Available' }
];

export const mockTrips: Trip[] = [
  { id: 't1', code: 'TRP-101', route: { source: 'New York, NY', destination: 'Boston, MA' }, status: 'Dispatched', vehicleId: 'v2', driverId: 'd2', cargoWeight: 15000, plannedDistance: 350, createdAt: '2024-04-15T08:00:00Z' },
  { id: 't2', code: 'TRP-102', route: { source: 'Chicago, IL', destination: 'Detroit, MI' }, status: 'Pending', vehicleId: 'v1', driverId: 'd1', cargoWeight: 8000, plannedDistance: 450, createdAt: '2024-04-16T10:00:00Z' }
];

export const mockMaintenance: MaintenanceLog[] = [
  { id: 'm1', vehicleId: 'v3', serviceType: 'Engine Overhaul', description: 'Replacing piston rings and gaskets', mechanic: 'AutoTech Inc', estCost: 4500, status: 'In Progress', dateLogged: '2024-04-10T14:30:00Z' }
];

export const mockExpenses: ExpenseLog[] = [
  { id: 'e1', type: 'Fuel', vehicleId: 'v2', amount: 350, description: 'Refuel at Pilot Flying J', dateLogged: '2024-04-14T18:00:00Z' },
  { id: 'e2', type: 'Other', amount: 1500, description: 'Annual insurance premium for Fleet A', dateLogged: '2024-04-01T09:00:00Z' }
];
