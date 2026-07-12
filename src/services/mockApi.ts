import { User, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';
import { mockUsers, mockVehicles, mockDrivers, mockTrips, mockMaintenance, mockExpenses } from './mockData';

// Helper to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    await delay();
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password') { // Dummy check
      return { token: `mock-token-${user.id}`, user };
    }
    throw new Error('Invalid credentials');
  }
};

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    await delay();
    return [...mockVehicles];
  }
};

export const driverService = {
  getDrivers: async (): Promise<Driver[]> => {
    await delay();
    return [...mockDrivers];
  }
};

export const tripService = {
  getTrips: async (): Promise<Trip[]> => {
    await delay();
    return [...mockTrips];
  }
};

export const maintenanceService = {
  getMaintenanceLogs: async (): Promise<MaintenanceLog[]> => {
    await delay();
    return [...mockMaintenance];
  }
};

export const expenseService = {
  getExpenses: async (): Promise<ExpenseLog[]> => {
    await delay();
    return [...mockExpenses];
  }
};
