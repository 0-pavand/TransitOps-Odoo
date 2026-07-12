import { api } from './api';
import { User, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';

// Helper to convert database snake_case to frontend camelCase
const mapVehicle = (v: any): Vehicle => ({
  id: String(v.id),
  regNo: v.reg_no,
  name: v.name,
  type: v.type,
  capacity: Number(v.capacity),
  odometer: Number(v.odometer),
  acqCost: Number(v.acq_cost),
  status: v.status,
});

const mapDriver = (d: any): Driver => ({
  id: String(d.id),
  name: d.name,
  licenseId: d.license_id,
  category: d.category,
  expiryDate: d.expiry_date,
  safetyScore: Number(d.safety_score),
  contact: d.contact,
  status: d.status,
});

const mapTrip = (t: any): Trip => ({
  id: String(t.id),
  code: t.code,
  route: {
    source: t.source,
    destination: t.destination,
  },
  status: t.status === 'Draft' ? 'Pending' : (t.status as any),
  vehicleId: String(t.vehicle_id),
  driverId: String(t.driver_id),
  cargoWeight: Number(t.cargo_weight),
  plannedDistance: Number(t.planned_distance),
  actualDistance: t.actual_distance ? Number(t.actual_distance) : undefined,
  fuelConsumed: t.fuel_consumed ? Number(t.fuel_consumed) : undefined,
  createdAt: t.created_at,
});

const mapMaintenance = (m: any): MaintenanceLog => ({
  id: String(m.id),
  vehicleId: String(m.vehicle_id),
  serviceType: m.service_type,
  description: m.description || '',
  mechanic: m.mechanic || '',
  estCost: Number(m.est_cost),
  status: m.status === 'Resolved' ? 'Resolved' : (m.status as any),
  dateLogged: m.date_logged,
});

const mapExpense = (e: any): ExpenseLog => ({
  id: String(e.id),
  type: e.type === 'Fuel' ? 'Fuel' : 'Other',
  vehicleId: e.vehicle_id ? String(e.vehicle_id) : undefined,
  amount: Number(e.amount),
  description: e.description || '',
  dateLogged: e.date_logged,
});

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/login', { email, password });
    return {
      token: res.data.token,
      user: {
        id: String(res.data.user.id),
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        department: res.data.user.department || '',
        status: res.data.user.status === 'active' ? 'Active' : 'Suspended',
      }
    };
  }
};

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await api.get('/vehicles');
    return res.data.map(mapVehicle);
  },
  createVehicle: async (v: { regNo: string; name: string; type: string; capacity: number; odometer: number; acqCost: number; region?: string }): Promise<Vehicle> => {
    const res = await api.post('/vehicles', {
      reg_no: v.regNo,
      name: v.name,
      type: v.type,
      capacity: v.capacity,
      odometer: v.odometer,
      acq_cost: v.acqCost,
      region: v.region || ''
    });
    return mapVehicle(res.data);
  },
  updateVehicleStatus: async (id: string, status: string): Promise<Vehicle> => {
    const res = await api.patch(`/vehicles/${id}/status`, { status });
    return mapVehicle(res.data);
  },
  retireVehicle: async (id: string): Promise<Vehicle> => {
    const res = await api.delete(`/vehicles/${id}`);
    return mapVehicle(res.data);
  }
};

export const driverService = {
  getDrivers: async (): Promise<Driver[]> => {
    const res = await api.get('/drivers');
    return res.data.map(mapDriver);
  },
  createDriver: async (d: { name: string; licenseId: string; category: string; expiryDate: string; safetyScore: number; contact: string }): Promise<Driver> => {
    const res = await api.post('/drivers', {
      name: d.name,
      license_id: d.licenseId,
      category: d.category,
      expiry_date: d.expiryDate,
      safety_score: d.safetyScore,
      contact: d.contact
    });
    return mapDriver(res.data);
  },
  updateDriverStatus: async (id: string, status: string): Promise<Driver> => {
    const res = await api.patch(`/drivers/${id}/status`, { status });
    return mapDriver(res.data);
  },
  renewDriver: async (id: string, driver: Driver, newExpiryDate: string): Promise<Driver> => {
    const res = await api.patch(`/drivers/${id}`, {
      name: driver.name,
      license_id: driver.licenseId,
      category: driver.category,
      expiry_date: newExpiryDate,
      safety_score: driver.safetyScore,
      contact: driver.contact
    });
    return mapDriver(res.data);
  },
  deleteDriver: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  }
};

export const tripService = {
  getTrips: async (): Promise<Trip[]> => {
    const res = await api.get('/trips');
    return res.data.map(mapTrip);
  },
  createTrip: async (t: { source: string; destination: string; vehicleId: number; driverId: number; cargoWeight: number; plannedDistance: number }): Promise<Trip> => {
    const res = await api.post('/trips', {
      source: t.source,
      destination: t.destination,
      vehicle_id: t.vehicleId,
      driver_id: t.driverId,
      cargo_weight: t.cargoWeight,
      planned_distance: t.plannedDistance
    });
    return mapTrip(res.data);
  },
  dispatchTrip: async (id: string): Promise<Trip> => {
    const res = await api.patch(`/trips/${id}/dispatch`);
    return mapTrip(res.data);
  },
  completeTrip: async (id: string, data: { finalOdometer: number; fuelConsumed: number }): Promise<Trip> => {
    const res = await api.patch(`/trips/${id}/complete`, {
      final_odometer: data.finalOdometer,
      fuel_consumed: data.fuelConsumed
    });
    return mapTrip(res.data);
  },
  cancelTrip: async (id: string): Promise<Trip> => {
    const res = await api.patch(`/trips/${id}/cancel`);
    return mapTrip(res.data);
  }
};

export const maintenanceService = {
  getMaintenanceLogs: async (): Promise<MaintenanceLog[]> => {
    const res = await api.get('/maintenance');
    return res.data.map(mapMaintenance);
  },
  createMaintenanceLog: async (m: { vehicleId: number; serviceType: string; description: string; mechanic: string; estCost: number }): Promise<MaintenanceLog> => {
    const res = await api.post('/maintenance', {
      vehicle_id: m.vehicleId,
      service_type: m.serviceType,
      description: m.description,
      mechanic: m.mechanic,
      est_cost: m.estCost
    });
    return mapMaintenance(res.data);
  },
  resolveMaintenanceLog: async (id: string): Promise<MaintenanceLog> => {
    const res = await api.patch(`/maintenance/${id}/resolve`);
    return mapMaintenance(res.data);
  }
};

export const expenseService = {
  getExpenses: async (): Promise<ExpenseLog[]> => {
    const res = await api.get('/expenses');
    return res.data.map(mapExpense);
  },
  createExpense: async (e: { type: 'Fuel' | 'Toll' | 'Maintenance' | 'Parking' | 'Other'; vehicleId?: number; tripId?: number; amount: number; liters?: number; description: string }): Promise<ExpenseLog> => {
    const res = await api.post('/expenses', {
      type: e.type,
      vehicle_id: e.vehicleId || null,
      trip_id: e.tripId || null,
      amount: e.amount,
      liters: e.liters || null,
      description: e.description
    });
    return mapExpense(res.data);
  }
};

const mapUser = (u: any): User => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department || '',
  status: u.status === 'active' ? 'Active' : 'Suspended',
});

export const settingsService = {
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data.map(mapUser);
  },
  createUser: async (u: { name: string; email: string; role: string; department?: string; password: string }): Promise<User> => {
    const res = await api.post('/users', {
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || '',
      password: u.password,
    });
    return mapUser(res.data);
  },
  updateUser: async (id: string, updates: { role?: string; status?: string }): Promise<User> => {
    const res = await api.patch(`/users/${id}`, updates);
    return mapUser(res.data);
  },
};

