import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseService, vehicleService, maintenanceService } from '../services/mockApi';
import { ExpenseLog, Vehicle, MaintenanceLog } from '../types';
import { Fuel, DollarSign, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

export function FuelExpenses() {
  const { role } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eData, vData, mData] = await Promise.all([
        expenseService.getExpenses(),
        vehicleService.getVehicles(),
        maintenanceService.getMaintenanceLogs()
      ]);
      setExpenses(eData);
      setVehicles(vData);
      setMaintenance(mData);
    } catch (e) {
      toast.error('Failed to load expenses data');
    } finally {
      setIsLoading(false);
    }
  };

  const hasWriteAccess = role === 'fleet_manager' || role === 'dispatcher' || role === 'financial_analyst';
  const fuelLogs = expenses.filter(e => e.type === 'Fuel');
  const otherExpenses = expenses.filter(e => e.type !== 'Fuel');
  
  const fuelTotal = fuelLogs.reduce((sum, e) => sum + e.amount, 0);
  const maintenanceTotal = maintenance.reduce((sum, m) => sum + (m.estCost || 0), 0);
  const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = fuelTotal + maintenanceTotal + otherTotal;

  // Fuel form states
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelDescription, setFuelDescription] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');

  // Other expense form states
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Other');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expenseService.createExpense({
        type: 'Fuel',
        vehicleId: Number(fuelVehicleId),
        amount: Number(fuelAmount),
        liters: Number(fuelLiters),
        description: fuelDescription
      });
      toast.success('Fuel logged successfully');
      setIsFuelModalOpen(false);
      setFuelVehicleId('');
      setFuelDescription('');
      setFuelAmount('');
      setFuelLiters('');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to log fuel';
      toast.error(msg);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expenseService.createExpense({
        type: expenseType as any,
        vehicleId: expenseVehicleId ? Number(expenseVehicleId) : undefined,
        amount: Number(expenseAmount),
        description: expenseDescription
      });
      toast.success('Expense added successfully');
      setIsExpenseModalOpen(false);
      setExpenseVehicleId('');
      setExpenseType('Other');
      setExpenseDescription('');
      setExpenseAmount('');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to add expense';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Fuel & Expenses</h1>
        
        {hasWriteAccess && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center px-3 py-2 bg-bg-input border border-border-subtle rounded-md text-sm hover:bg-bg-hover transition-colors text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </button>
            <button 
              onClick={() => setIsFuelModalOpen(true)}
              className="flex items-center px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
            >
              <Fuel className="w-4 h-4 mr-2" />
              Log Fuel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs Table */}
        <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-border-subtle bg-bg-input">
            <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Fuel Logs</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-text-secondary uppercase border-b border-border-subtle sticky top-0 bg-bg-card">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent mx-auto"></div></td></tr>
                ) : fuelLogs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-text-secondary">No fuel logs.</td></tr>
                ) : (
                  fuelLogs.map(log => {
                    const v = vehicles.find(x => x.id === log.vehicleId);
                    return (
                      <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                        <td className="px-4 py-2 text-text-secondary">{new Date(log.dateLogged).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">{v?.regNo || '-'}</td>
                        <td className="px-4 py-2 truncate max-w-[200px]" title={log.description}>{log.description}</td>
                        <td className="px-4 py-2 text-right text-accent font-medium">₹{log.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Expenses Table */}
        <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-border-subtle bg-bg-input">
            <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Other Expenses</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-text-secondary uppercase border-b border-border-subtle sticky top-0 bg-bg-card">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent mx-auto"></div></td></tr>
                ) : otherExpenses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No other expenses.</td></tr>
                ) : (
                  otherExpenses.map(log => {
                    const v = vehicles.find(x => x.id === log.vehicleId);
                    return (
                      <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                        <td className="px-4 py-2 text-text-secondary">{new Date(log.dateLogged).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">{v?.regNo || '-'}</td>
                        <td className="px-4 py-2 text-text-secondary">{log.type}</td>
                        <td className="px-4 py-2 truncate max-w-[200px]" title={log.description}>{log.description}</td>
                        <td className="px-4 py-2 text-right text-info font-medium">₹{log.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">TOTAL OPERATIONAL COST (2025) = FUEL + MAINTENANCE</h2>
          <p className="text-text-secondary text-sm">Combined total of all fuel, maintenance, and other logged expenses.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-accent/10 rounded-lg hidden sm:block">
            <DollarSign className="w-8 h-8 text-accent" />
          </div>
          <span className="text-4xl font-bold text-accent">₹{totalCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel">
        <form onSubmit={handleLogFuel} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Vehicle</label>
            <select required value={fuelVehicleId} onChange={e => setFuelVehicleId(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNo} - {v.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Description</label>
            <input type="text" required value={fuelDescription} onChange={e => setFuelDescription(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. 50 Liters Diesel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Liters</label>
              <input type="number" required min="1" value={fuelLiters} onChange={e => setFuelLiters(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Amount (₹)</label>
              <input type="number" required min="1" value={fuelAmount} onChange={e => setFuelAmount(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-md transition-colors">
              Save Log
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Vehicle (Optional)</label>
            <select value={expenseVehicleId} onChange={e => setExpenseVehicleId(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">No Specific Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNo} - {v.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Description</label>
            <input type="text" required value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Toll Fees" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Type</label>
              <select required value={expenseType} onChange={e => setExpenseType(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="Other">Other</option>
                <option value="Toll">Toll</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Parking">Parking</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase">Amount (₹)</label>
              <input type="number" required min="1" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-info hover:bg-info/80 text-white font-medium py-2 rounded-md transition-colors">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
