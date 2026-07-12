import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicleService, tripService, driverService } from '../services/mockApi';
import { Vehicle, Trip, Driver } from '../types';
import { Truck, Map, Users, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function Dashboard() {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [v, t, d] = await Promise.all([
        vehicleService.getVehicles(),
        tripService.getTrips(),
        driverService.getDrivers()
      ]);
      setVehicles(v);
      setTrips(t);
      setDrivers(d);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-24 bg-bg-card rounded-md"></div>
      <div className="h-64 bg-bg-card rounded-md"></div>
    </div>;
  }

  // Calculate Metrics
  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter(t => t.status === 'Pending').length;
  const driversOnDuty = drivers.filter(d => d.status === 'On Trip' || d.status === 'Available').length;
  const utilization = vehicles.length ? Math.round((activeVehicles / vehicles.length) * 100) : 0;
  
  // Fake chart data
  const vehicleStatusData = [
    { name: 'Available', count: availableVehicles, fill: '#27AE60' },
    { name: 'On Trip', count: activeVehicles, fill: '#3498DB' },
    { name: 'In Shop', count: maintenanceVehicles, fill: '#F39C12' },
    { name: 'Retired', count: vehicles.filter(v => v.status === 'Retired').length, fill: '#E74C3C' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="flex space-x-2">
          {/* Simple filter mock */}
          <select className="bg-bg-input border border-border-subtle rounded-md px-3 py-1.5 text-sm outline-none">
            <option>All Regions</option>
            <option>North</option>
            <option>South</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === 'fleet_manager' || role === 'dispatcher') && (
          <>
            <KPICard title="Active / Available Vehicles" value={`${activeVehicles} / ${availableVehicles}`} icon={Truck} />
            <KPICard title="Active / Pending Trips" value={`${activeTrips} / ${pendingTrips}`} icon={Map} />
          </>
        )}
        
        {(role === 'fleet_manager' || role === 'safety_officer') && (
          <KPICard title="Drivers On Duty" value={driversOnDuty} icon={Users} />
        )}
        
        {(role === 'fleet_manager' || role === 'financial_analyst') && (
          <KPICard title="Fleet Utilization" value={`${utilization}%`} icon={Percent} />
        )}

        {role === 'fleet_manager' && (
          <KPICard title="In Maintenance" value={maintenanceVehicles} icon={AlertCircle} color="text-warning" />
        )}

        {role === 'financial_analyst' && (
          <KPICard title="Est. Cost Today" value="$4,250" icon={DollarSign} />
        )}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-4">Recent Trips</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-bg-input border-y border-border-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trip ID</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {trips.slice(0,5).map(trip => (
                  <tr key={trip.id} className="border-b border-border-subtle hover:bg-bg-hover">
                    <td className="px-4 py-3 font-medium">{trip.code}</td>
                    <td className="px-4 py-3">{trip.route.source} &rarr; {trip.route.destination}</td>
                    <td className="px-4 py-3"><StatusBadge status={trip.status} /></td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(trip.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-text-secondary">No recent trips</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-4">Vehicle Status</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                <XAxis type="number" stroke="#A0A0A0" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color = "text-accent" }: { title: string, value: string | number, icon: any, color?: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={`p-2 rounded-md bg-bg-input ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
