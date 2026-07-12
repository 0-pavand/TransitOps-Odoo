import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/mockApi';
import { Vehicle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function Fleet() {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (e) {
      toast.error('Failed to load fleet');
    } finally {
      setIsLoading(false);
    }
  };

  const isManager = role === 'fleet_manager';

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.regNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Vehicle added successfully');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Fleet Registry</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors w-48 sm:w-64"
            />
          </div>
          
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="All">All Types</option>
            <option value="Heavy Duty">Heavy Duty</option>
            <option value="Light Van">Light Van</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
            <option value="Bike">Bike</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          {isManager && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="bg-warning/10 border border-warning/30 rounded-md p-4 flex items-start space-x-3">
        <AlertTriangle className="text-warning w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-warning font-medium text-sm">Important Notice</h4>
          <p className="text-text-secondary text-xs mt-1">Only Registration-No. can be unique. Retired/In-Shop vehicles are hidden from Trip Dispatch.</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-text-secondary uppercase bg-bg-input border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 font-semibold">Reg. Number</th>
                <th className="px-6 py-4 font-semibold">Vehicle Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Odometer</th>
                <th className="px-6 py-4 font-semibold">Acq. Cost</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                {isManager && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isManager ? 8 : 7} className="px-6 py-8 text-center text-text-secondary">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 8 : 7} className="px-6 py-8 text-center text-text-secondary">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                    <td className="px-6 py-2 font-medium">{vehicle.regNo}</td>
                    <td className="px-6 py-2">{vehicle.name}</td>
                    <td className="px-6 py-2 text-text-secondary">{vehicle.type}</td>
                    <td className="px-6 py-2">{vehicle.capacity.toLocaleString()} kg</td>
                    <td className="px-6 py-2">{vehicle.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-2">${vehicle.acqCost.toLocaleString()}</td>
                    <td className="px-6 py-2"><StatusBadge status={vehicle.status} /></td>
                    {isManager && (
                      <td className="px-6 py-2 text-right space-x-2">
                        {vehicle.status === 'Available' && (
                          <button className="text-xs text-info hover:text-white px-2 py-1 rounded border border-info/30 hover:bg-info/10 transition-colors"
                            onClick={() => toast.success(`Status updated to On Trip`)}>
                            On Trip
                          </button>
                        )}
                        <button className="text-xs text-warning hover:text-white px-2 py-1 rounded border border-warning/30 hover:bg-warning/10 transition-colors"
                          onClick={() => toast.success(`Status updated to In Shop`)}>
                          In Shop
                        </button>
                        <button className="text-xs text-danger hover:text-white px-2 py-1 rounded border border-danger/30 hover:bg-danger/10 transition-colors"
                          onClick={() => toast.success(`Vehicle retired`)}>
                          Retire
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Vehicle">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Reg Number</label>
            <input type="text" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. TRK-9999" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Vehicle Name</label>
            <input type="text" required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Volvo FH16" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Type</label>
            <select required className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">Select Type</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Bus">Bus</option>
              <option value="Bike">Bike</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Max Capacity (kg)</label>
              <input type="number" required min="1" className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Acquisition Cost ($)</label>
              <input type="number" required min="0" className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Region (Optional)</label>
            <input type="text" className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. North, West" />
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-md transition-colors">
              Save Vehicle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
