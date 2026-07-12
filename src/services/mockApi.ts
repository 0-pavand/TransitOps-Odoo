import { User, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';
import { api } from './api';

const toUser = (user: any): User => ({ ...user, id: String(user.id), status: user.status === 'active' ? 'Active' : 'Suspended' });
const toVehicle = (vehicle: any): Vehicle => ({ id: String(vehicle.id), regNo: vehicle.reg_no, name: vehicle.name, type: vehicle.type, capacity: Number(vehicle.capacity), odometer: Number(vehicle.odometer), acqCost: Number(vehicle.acq_cost), status: vehicle.status });
const toDriver = (driver: any): Driver => ({ id: String(driver.id), name: driver.name, licenseId: driver.license_id, category: driver.category, expiryDate: driver.expiry_date, safetyScore: Number(driver.safety_score), contact: driver.contact, status: driver.status });
const toTrip = (trip: any): Trip => ({ id: String(trip.id), code: trip.code, route: { source: trip.source, destination: trip.destination }, status: trip.status === 'Draft' ? 'Pending' : trip.status, vehicleId: String(trip.vehicle_id), driverId: String(trip.driver_id), cargoWeight: Number(trip.cargo_weight), plannedDistance: Number(trip.planned_distance), createdAt: trip.created_at });
const toMaintenance = (log: any): MaintenanceLog => ({ id: String(log.id), vehicleId: String(log.vehicle_id), serviceType: log.service_type, description: log.description ?? '', mechanic: log.mechanic ?? '', estCost: Number(log.est_cost), status: log.status === 'In Shop' ? 'In Progress' : log.status, dateLogged: log.date_logged });
const toExpense = (expense: any): ExpenseLog => ({ id: String(expense.id), type: expense.type === 'Fuel' ? 'Fuel' : 'Other', vehicleId: expense.vehicle_id ? String(expense.vehicle_id) : undefined, amount: Number(expense.amount), description: expense.description ?? '', dateLogged: expense.date_logged });

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
  }
};

export const driverService = {
  getDrivers: async (): Promise<Driver[]> => {
    const { data } = await api.get('/drivers');
    return data.map(toDriver);
  }
};

export const tripService = {
  getTrips: async (): Promise<Trip[]> => {
    const { data } = await api.get('/trips');
    return data.map(toTrip);
  }
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
