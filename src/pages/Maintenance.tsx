import React, { useEffect, useState } from 'react';
import { vehicleService, maintenanceService } from '../services/mockApi';
import { MaintenanceLog, Vehicle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Wrench, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export function Maintenance() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [estCost, setEstCost] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mData, vData] = await Promise.all([
        maintenanceService.getMaintenanceLogs(),
        vehicleService.getVehicles()
      ]);
      setLogs(mData);
      setVehicles(vData);
    } catch (e) {
      toast.error('Failed to load maintenance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceService.createMaintenanceLog({
        vehicleId: Number(selectedVehicleId),
        serviceType,
        description,
        mechanic,
        estCost: Number(estCost)
      });
      toast.success('Service logged successfully!');
      setSelectedVehicleId('');
      setServiceType('');
      setDescription('');
      setMechanic('');
      setEstCost('');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to log maintenance';
      toast.error(msg);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await maintenanceService.resolveMaintenanceLog(id);
      toast.success('Maintenance resolved!');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to resolve maintenance';
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
      
      {/* Left Panel - Log Service Form */}
      <div className="w-full lg:w-[400px] flex flex-col min-h-0 bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-accent" />
            Log Service
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleLogService} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Vehicle</label>
              <select required value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.regNo} - {v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Service Type</label>
              <input type="text" required value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Engine Overhaul, Oil Change" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" placeholder="Details of the service..." />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Mechanic / Vendor</label>
              <input type="text" required value={mechanic} onChange={e => setMechanic(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Vendor Name" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Estimated Cost (₹)</label>
              <input type="number" required min="0" value={estCost} onChange={e => setEstCost(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>

            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-md transition-colors mt-6">
              Log Maintenance
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel - Maintenance Logs */}
      <div className="flex-1 flex flex-col min-h-0 bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center">
          <h2 className="text-lg font-semibold">Service Log</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search logs..."
              className="bg-bg-input border border-border-subtle rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-bg-input border-b border-border-subtle sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Cost</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                      No maintenance logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const v = vehicles.find(x => x.id === log.vehicleId);
                    return (
                      <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                        <td className="px-6 py-4 font-medium">{v?.regNo || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{log.serviceType}</div>
                          <div className="text-xs text-text-secondary mt-1">{log.mechanic}</div>
                        </td>
                        <td className="px-6 py-4">₹{log.estCost.toLocaleString()}</td>
                        <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                        <td className="px-6 py-4 text-right">
                          {log.status !== 'Resolved' && (
                            <button 
                              className="text-xs flex items-center justify-end w-full text-success hover:text-white px-2 py-1 rounded border border-transparent hover:border-success/30 hover:bg-success/10 transition-colors"
                              onClick={() => handleResolve(log.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border-subtle bg-bg-input/50 flex items-center justify-center space-x-3 text-xs text-text-secondary font-medium">
            <span>Logged</span>
            <span className="text-text-secondary opacity-50">&rarr;</span>
            <span className="text-warning">In Progress</span>
            <span className="text-text-secondary opacity-50">&rarr;</span>
            <span className="text-success">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
