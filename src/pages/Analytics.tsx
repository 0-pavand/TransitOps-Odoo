import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { maintenanceService, expenseService, vehicleService } from '../services/mockApi';
import { Vehicle, MaintenanceLog, ExpenseLog } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown, Percent, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatusBadge } from '../components/StatusBadge';

interface VehicleSummary {
  id: number;
  reg_no: string;
  name: string;
  acq_cost: number;
  status: string;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_operational_cost: number;
  total_distance: number;
  total_fuel_consumed: number;
  fuel_efficiency: number;
}

export function Analytics() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('KPIs Overview');
  const [isLoading, setIsLoading] = useState(true);

  // Real data state
  const [vehicleSummaries, setVehicleSummaries] = useState<VehicleSummary[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [overallEfficiency, setOverallEfficiency] = useState(0);
  const [utilizationPct, setUtilizationPct] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [effRes, utilRes, costRes, mLogs, eLogs, vList] = await Promise.all([
        api.get('/analytics/fuel-efficiency'),
        api.get('/analytics/fleet-utilization'),
        api.get('/analytics/operational-cost'),
        maintenanceService.getMaintenanceLogs(),
        expenseService.getExpenses(),
        vehicleService.getVehicles(),
      ]);
      setVehicleSummaries(costRes.data);
      setOverallEfficiency(effRes.data.overall_average ?? 0);
      setUtilizationPct(utilRes.data.utilization_pct ?? 0);
      setMaintenanceLogs(mLogs);
      setExpenses(eLogs);
      setVehicles(vList);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/analytics/export?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vehicle-cost-summary.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Derived chart data from real summaries
  const topCostData = vehicleSummaries.map(v => ({
    name: v.reg_no,
    maintenance: v.total_maintenance_cost,
    fuel: v.total_fuel_cost,
  }));

  const fuelEfficiencyData = vehicleSummaries
    .filter(v => v.total_fuel_consumed > 0)
    .map(v => ({ name: v.reg_no, efficiency: v.fuel_efficiency }));

  const fuelEfficiencyTableData = vehicleSummaries
    .filter(v => v.total_fuel_consumed > 0)
    .map((v, i) => ({
      id: String(i + 1),
      vehicle: v.reg_no,
      distance: v.total_distance,
      fuel: v.total_fuel_consumed,
      efficiency: v.fuel_efficiency,
    }));

  const expensesChartData = vehicleSummaries.map(v => ({
    name: v.reg_no,
    cost: v.total_operational_cost,
  }));

  const expensesTableData = expenses.map((e, i) => {
    const v = vehicles.find(x => x.id === e.vehicleId);
    return {
      id: String(i + 1),
      vehicle: v?.regNo || '—',
      trip: '—',
      type: e.type,
      amount: e.amount,
      date: new Date(e.dateLogged).toLocaleDateString(),
    };
  });

  const maintenanceChartData = vehicleSummaries.map(v => ({
    name: v.reg_no,
    cost: v.total_maintenance_cost,
  }));

  const maintenanceTableData = maintenanceLogs.map((m, i) => {
    const v = vehicles.find(x => x.id === m.vehicleId);
    return {
      id: String(i + 1),
      vehicle: v?.regNo || '—',
      type: m.serviceType,
      cost: m.estCost,
      status: m.status,
      date: new Date(m.dateLogged).toLocaleDateString(),
    };
  });

  // KPI metrics computed from real data
  const totalFuelCost = vehicleSummaries.reduce((s, v) => s + v.total_fuel_cost, 0);
  const totalMaintenanceCost = vehicleSummaries.reduce((s, v) => s + v.total_maintenance_cost, 0);
  const totalOpCost = vehicleSummaries.reduce((s, v) => s + v.total_operational_cost, 0);
  const vehiclesInShop = maintenanceLogs.filter(m => m.status !== 'Resolved').length;

  const tabs = ['KPIs Overview', 'Expenses', 'Maintenance', 'Fuel Efficiency'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border-subtle rounded-lg h-28 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border-subtle rounded-lg h-[350px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Analytics &amp; Reports</h1>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-3 py-2 bg-transparent border border-border-subtle rounded-md text-sm hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle overflow-x-auto mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <>
        {activeTab === 'KPIs Overview' && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Avg Fuel Efficiency"
                value={overallEfficiency > 0 ? `${overallEfficiency} km/L` : '— km/L'}
                icon={Activity}
              />
              <MetricCard
                title="Fleet Utilization"
                value={`${utilizationPct}%`}
                icon={Percent}
              />
              <MetricCard
                title="Total Operational Cost"
                value={`₹${totalOpCost.toLocaleString()}`}
                icon={DollarSign}
              />
              <MetricCard
                title="In Maintenance"
                value={String(vehiclesInShop)}
                icon={TrendingUp}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Top Cost by Vehicle (₹)</h2>
                {topCostData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">No data yet</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCostData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                        <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#2F2F2F' }} contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#E67E22" radius={[0, 0, 0, 0]} barSize={32} />
                        <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#3498DB" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Fuel Efficiency by Vehicle (km/L)</h2>
                {fuelEfficiencyData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">No completed trips with fuel data yet</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelEfficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                        <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#2F2F2F' }} contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }} />
                        <Bar dataKey="efficiency" name="Efficiency" fill="#27AE60" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'Expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard title="Total Expenses" value={`₹${totalOpCost.toLocaleString()}`} icon={TrendingUp} />
              <MetricCard title="Fuel Cost" value={`₹${totalFuelCost.toLocaleString()}`} icon={Activity} />
              <MetricCard title="Maintenance Cost" value={`₹${totalMaintenanceCost.toLocaleString()}`} icon={DollarSign} />
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Top Cost by Vehicle (₹)</h2>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center px-3 py-1.5 bg-transparent border border-border-subtle rounded-md text-xs hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export CSV
                </button>
              </div>
              {expensesChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">No data yet</div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                      <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#2F2F2F' }} contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }} />
                      <Bar dataKey="cost" name="Cost (₹)" fill="#E67E22" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border-subtle bg-bg-input">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Expenses Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-text-secondary uppercase bg-bg-card border-b border-border-subtle">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Vehicle</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount (₹)</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesTableData.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No expenses recorded yet.</td></tr>
                    ) : expensesTableData.map((row) => (
                      <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                        <td className="px-6 py-2 font-medium">{row.vehicle}</td>
                        <td className="px-6 py-2">{row.type}</td>
                        <td className="px-6 py-2 text-right font-medium text-accent">₹{row.amount.toLocaleString()}</td>
                        <td className="px-6 py-2 text-text-secondary">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Maintenance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard title="Total Maintenance Cost" value={`₹${totalMaintenanceCost.toLocaleString()}`} icon={DollarSign} />
              <MetricCard title="Vehicles In Shop" value={String(vehiclesInShop)} icon={Activity} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border-subtle bg-bg-input">
                  <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Maintenance Logs</h2>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-text-secondary uppercase bg-bg-card border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Vehicle</th>
                        <th className="px-6 py-4 font-semibold">Service Type</th>
                        <th className="px-6 py-4 font-semibold text-right">Cost (₹)</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceTableData.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-text-secondary">No maintenance records yet.</td></tr>
                      ) : maintenanceTableData.map((row) => (
                        <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                          <td className="px-6 py-2 font-medium">{row.vehicle}</td>
                          <td className="px-6 py-2 text-text-secondary">{row.type}</td>
                          <td className="px-6 py-2 text-right font-medium text-accent">₹{row.cost.toLocaleString()}</td>
                          <td className="px-6 py-2"><StatusBadge status={row.status as any} /></td>
                          <td className="px-6 py-2 text-text-secondary">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Maintenance Cost by Vehicle (₹)</h2>
                {maintenanceChartData.filter(d => d.cost > 0).length === 0 ? (
                  <div className="flex-1 min-h-[250px] flex items-center justify-center text-text-secondary text-sm">No data yet</div>
                ) : (
                  <div className="flex-1 min-h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={maintenanceChartData.filter(d => d.cost > 0)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                        <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#2F2F2F' }} contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }} />
                        <Bar dataKey="cost" name="Cost (₹)" fill="#E67E22" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Fuel Efficiency' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Fleet Avg Efficiency"
                value={overallEfficiency > 0 ? `${overallEfficiency} km/L` : '— km/L'}
                icon={Activity}
              />
              <MetricCard
                title="Total Fuel Consumed"
                value={`${vehicleSummaries.reduce((s, v) => s + v.total_fuel_consumed, 0).toLocaleString()} L`}
                icon={Activity}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Fuel Efficiency by Vehicle (km/L)</h2>
                {fuelEfficiencyData.length === 0 ? (
                  <div className="flex-1 min-h-[250px] flex items-center justify-center text-text-secondary text-sm">No trips completed yet</div>
                ) : (
                  <div className="flex-1 min-h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelEfficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                        <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#2F2F2F' }} contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }} />
                        <Bar dataKey="efficiency" name="Efficiency (km/L)" fill="#E67E22" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border-subtle bg-bg-input">
                  <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Efficiency Records</h2>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-text-secondary uppercase bg-bg-card border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Vehicle</th>
                        <th className="px-6 py-4 font-semibold text-right">Distance (KM)</th>
                        <th className="px-6 py-4 font-semibold text-right">Fuel Consumed (L)</th>
                        <th className="px-6 py-4 font-semibold text-right">Efficiency (KM/L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelEfficiencyTableData.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No completed trips with fuel data.</td></tr>
                      ) : fuelEfficiencyTableData.map((row) => (
                        <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                          <td className="px-6 py-2 font-medium">{row.vehicle}</td>
                          <td className="px-6 py-2 text-right">{row.distance.toLocaleString()}</td>
                          <td className="px-6 py-2 text-right">{row.fuel.toLocaleString()}</td>
                          <td className="px-6 py-2 text-right font-medium text-accent">{row.efficiency.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-md bg-bg-input text-text-secondary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}
