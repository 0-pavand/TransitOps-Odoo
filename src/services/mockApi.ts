import { User, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';
import { api } from './api';

const toUser = (user: any): User => ({ ...user, id: String(user.id), status: user.status === 'active' ? 'Active' : 'Suspended' });
const toVehicle = (v: any): Vehicle => ({ id: String(v.id), regNo: v.reg_no, name: v.name, type: v.type, capacity: Number(v.capacity), odometer: Number(v.odometer), acqCost: Number(v.acq_cost), status: v.status });
const toDriver = (d: any): Driver => ({ id: String(d.id), name: d.name, licenseId: d.license_id, category: d.category, expiryDate: d.expiry_date, safetyScore: Number(d.safety_score), contact: d.contact, status: d.status });
const toTrip = (t: any): Trip => ({ id: String(t.id), code: t.code, route: { source: t.source, destination: t.destination }, status: t.status === 'Draft' ? 'Pending' : t.status, vehicleId: String(t.vehicle_id), driverId: String(t.driver_id), cargoWeight: Number(t.cargo_weight), plannedDistance: Number(t.planned_distance), createdAt: t.created_at });
const toMaintenance = (log: any): MaintenanceLog => ({ id: String(log.id), vehicleId: String(log.vehicle_id), serviceType: log.service_type, description: log.description ?? '', mechanic: log.mechanic ?? '', estCost: Number(log.est_cost), status: log.status === 'In Shop' ? 'In Progress' : log.status, dateLogged: log.date_logged });
const toExpense = (e: any): ExpenseLog => ({ id: String(e.id), type: e.type === 'Fuel' ? 'Fuel' : 'Other', vehicleId: e.vehicle_id ? String(e.vehicle_id) : undefined, amount: Number(e.amount), description: e.description ?? '', dateLogged: e.date_logged });

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const { data } = await api.post('/auth/login', { email, password });
    return { token: data.token, user: toUser(data.user) };
  }
};

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles');
    return data.map(toVehicle);
  },
  createVehicle: async (payload: {
    reg_no: string; name: string; type: string;
    capacity: number; acq_cost: number; region?: string;
  }): Promise<Vehicle> => {
    const { data } = await api.post('/vehicles', payload);
    return toVehicle(data);
  },
  updateStatus: async (id: string, status: string): Promise<Vehicle> => {
    const { data } = await api.patch(`/vehicles/${id}/status`, { status });
    return toVehicle(data);
  },
  retire: async (id: string): Promise<Vehicle> => {
    const { data } = await api.delete(`/vehicles/${id}`);
    return toVehicle(data);
  },
};

export const driverService = {
  getDrivers: async (): Promise<Driver[]> => {
    const { data } = await api.get('/drivers');
    return data.map(toDriver);
  },
  createDriver: async (payload: {
    name: string; license_id: string; category: string;
    expiry_date: string; contact: string; safety_score: number;
  }): Promise<Driver> => {
    const { data } = await api.post('/drivers', payload);
    return toDriver(data);
  },
  updateStatus: async (id: string, status: string): Promise<Driver> => {
    const { data } = await api.patch(`/drivers/${id}/status`, { status });
    return toDriver(data);
  },
};

export const tripService = {
  getTrips: async (): Promise<Trip[]> => {
    const { data } = await api.get('/trips');
    return data.map(toTrip);
  },
  createTrip: async (payload: {
    source: string; destination: string; vehicle_id: number;
    driver_id: number; cargo_weight: number; planned_distance: number;
  }): Promise<Trip> => {
    const { data } = await api.post('/trips', payload);
    return toTrip(data);
  },
  dispatch: async (id: string): Promise<Trip> => {
    const { data } = await api.patch(`/trips/${id}/dispatch`);
    return toTrip(data);
  },
  complete: async (id: string, final_odometer: number, fuel_consumed: number): Promise<Trip> => {
    const { data } = await api.patch(`/trips/${id}/complete`, { final_odometer, fuel_consumed });
    return toTrip(data);
  },
  cancel: async (id: string): Promise<Trip> => {
    const { data } = await api.patch(`/trips/${id}/cancel`);
    return toTrip(data);
  },
};

export const maintenanceService = {
  getMaintenanceLogs: async (): Promise<MaintenanceLog[]> => {
    const { data } = await api.get('/maintenance');
    return data.map(toMaintenance);
  }
};

export const expenseService = {
  getExpenses: async (): Promise<ExpenseLog[]> => {
    const { data } = await api.get('/expenses');
    return data.map(toExpense);
  }
};
