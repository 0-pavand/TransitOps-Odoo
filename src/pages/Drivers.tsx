import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { driverService } from '../services/mockApi';
import { Driver } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Search, Plus, Filter, AlertOctagon } from 'lucide-react';
import toast from 'react-hot-toast';

export function Drivers() {
  const { role } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch (e) {
      toast.error('Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const hasFullAccess = role === 'fleet_manager' || role === 'safety_officer';

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.licenseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'text-danger', icon: AlertOctagon, text: 'Expired' };
    if (diffDays <= 30) return { color: 'text-warning', icon: AlertOctagon, text: `Expires in ${diffDays} days` };
    return { color: 'text-text-secondary', icon: null, text: expiryDate };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Driver added successfully');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Drivers Registry</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors w-48 sm:w-64"
            />
          </div>
          {hasFullAccess && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-md p-4 flex items-start space-x-3">
        <AlertOctagon className="text-warning w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-warning font-medium text-sm">Driver Eligibility</h4>
          <p className="text-text-secondary text-xs mt-1">Only licensed, non-suspended drivers appear in Trip Dispatch.</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-text-secondary uppercase bg-bg-input border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">License ID</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Expiry</th>
                <th className="px-6 py-4 font-semibold">Safety Score</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                {hasFullAccess && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={hasFullAccess ? 8 : 7} className="px-6 py-8 text-center text-text-secondary">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={hasFullAccess ? 8 : 7} className="px-6 py-8 text-center text-text-secondary">
                    No records yet.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(driver => {
                  const expiry = getExpiryStatus(driver.expiryDate);
                  const ExpiryIcon = expiry.icon;
                  
                  return (
                    <tr key={driver.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                      <td className="px-6 py-2 font-medium">{driver.name}</td>
                      <td className="px-6 py-2">{driver.licenseId}</td>
                      <td className="px-6 py-2 text-text-secondary">{driver.category}</td>
                      <td className={`px-6 py-2 font-medium flex items-center space-x-2 ${expiry.color}`}>
                        {ExpiryIcon && <ExpiryIcon className="w-4 h-4" />}
                        <span>{expiry.text}</span>
                      </td>
                      <td className="px-6 py-2">
                        <span className={`font-semibold ${driver.safetyScore >= 90 ? 'text-success' : driver.safetyScore >= 75 ? 'text-warning' : 'text-danger'}`}>
                          {driver.safetyScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-2 text-text-secondary">{driver.contact}</td>
                      <td className="px-6 py-2"><StatusBadge status={driver.status} /></td>
                      {hasFullAccess && (
                        <td className="px-6 py-2 text-right space-x-2">
                          {driver.status === 'Available' && (
                            <button 
                              className="text-xs text-info hover:text-white px-2 py-1 rounded border border-info/30 hover:bg-info/10 transition-colors"
                              onClick={() => toast.success(`Status updated to On Trip`)}>
                              On Trip
                            </button>
                          )}
                          <button 
                            className="text-xs text-text-secondary hover:text-white px-2 py-1 rounded border border-border-subtle hover:bg-bg-input transition-colors"
                            onClick={() => toast.success(`Status updated to Off Duty`)}>
                            Off Duty
                          </button>
                          <button 
                            className="text-xs text-danger hover:text-white px-2 py-1 rounded border border-danger/30 hover:bg-danger/10 transition-colors"
                            onClick={() => toast.error(`Driver suspended`)}>
                            Suspend
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Driver">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Full Name</label>
            <input type="text" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">License Number</label>
              <input type="text" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="DL-XXXXX" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">License Category</label>
              <input type="text" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Class A" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Expiry Date</label>
            <input type="date" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Contact Number</label>
              <input type="tel" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="+1..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Initial Safety Score</label>
              <input type="number" required min="0" max="100" defaultValue="100" className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-md transition-colors">
              Save Driver
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
