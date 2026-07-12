import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { RoleGuard } from './components/RoleGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { FuelExpenses } from './pages/FuelExpenses';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#242424', color: '#fff', border: '1px solid #333' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<Layout />}>
            <Route path="dashboard" element={
              <RoleGuard allowedRoles={['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']}>
                <Dashboard />
              </RoleGuard>
            } />
            <Route path="fleet" element={
              <RoleGuard allowedRoles={['fleet_manager', 'dispatcher']}>
                <Fleet />
              </RoleGuard>
            } />
            <Route path="drivers" element={
              <RoleGuard allowedRoles={['fleet_manager', 'dispatcher', 'safety_officer']}>
                <Drivers />
              </RoleGuard>
            } />
            <Route path="trips" element={
              <RoleGuard allowedRoles={['fleet_manager', 'dispatcher', 'safety_officer']}>
                <Trips />
              </RoleGuard>
            } />
            <Route path="maintenance" element={
              <RoleGuard allowedRoles={['fleet_manager']}>
                <Maintenance />
              </RoleGuard>
            } />
            <Route path="expenses" element={
              <RoleGuard allowedRoles={['fleet_manager', 'dispatcher', 'financial_analyst']}>
                <FuelExpenses />
              </RoleGuard>
            } />
            <Route path="analytics" element={
              <RoleGuard allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                <Analytics />
              </RoleGuard>
            } />
            <Route path="settings" element={
              <RoleGuard allowedRoles={['fleet_manager']}>
                <Settings />
              </RoleGuard>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
