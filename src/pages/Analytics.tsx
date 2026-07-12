import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown, Percent, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatusBadge } from '../components/StatusBadge';

export function Analytics() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('KPIs Overview');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  };
  
  // Fake chart data
  const topCostData = [
    { name: 'TRK-1001', maintenance: 4000, fuel: 2400 },
    { name: 'TRK-1002', maintenance: 3000, fuel: 1398 },
    { name: 'VAN-2001', maintenance: 2000, fuel: 9800 },
    { name: 'TRK-1003', maintenance: 2780, fuel: 3908 },
    { name: 'TRK-1004', maintenance: 1890, fuel: 4800 },
  ];

  const fuelEfficiencyData = [
    { name: 'TRK-1001', efficiency: 6.5 },
    { name: 'TRK-1002', efficiency: 7.2 },
    { name: 'VAN-2001', efficiency: 12.4 },
    { name: 'TRK-1003', efficiency: 6.1 },
    { name: 'TRK-1004', efficiency: 8.0 },
  ];

  const fuelEfficiencyTableData = [
    { id: '1', vehicle: 'TRK-1001', distance: 2600, fuel: 400, efficiency: 6.5 },
    { id: '2', vehicle: 'TRK-1002', distance: 1800, fuel: 250, efficiency: 7.2 },
    { id: '3', vehicle: 'VAN-2001', distance: 3100, fuel: 250, efficiency: 12.4 },
    { id: '4', vehicle: 'TRK-1003', distance: 2745, fuel: 450, efficiency: 6.1 },
    { id: '5', vehicle: 'TRK-1004', distance: 3200, fuel: 400, efficiency: 8.0 },
  ];

  // Expenses Tab Mock Data
  const expensesChartData = [
    { name: 'TRK-1001', cost: 12400 },
    { name: 'TRK-1002', cost: 8950 },
    { name: 'VAN-2001', cost: 6200 },
    { name: 'TRK-1003', cost: 14800 },
    { name: 'TRK-1004', cost: 10100 },
  ];

  const expensesTableData = [
    { id: '1', vehicle: 'TRK-1001', trip: 'TRP-8821', type: 'Fuel', amount: 4500, date: '2025-10-14' },
    { id: '2', vehicle: 'TRK-1002', trip: 'TRP-8822', type: 'Toll', amount: 350, date: '2025-10-14' },
    { id: '3', vehicle: 'VAN-2001', trip: 'TRP-8823', type: 'Maintenance', amount: 12000, date: '2025-10-13' },
    { id: '4', vehicle: 'TRK-1003', trip: 'TRP-8824', type: 'Parking', amount: 150, date: '2025-10-12' },
    { id: '5', vehicle: 'TRK-1004', trip: 'TRP-8825', type: 'Fuel', amount: 3800, date: '2025-10-12' },
    { id: '6', vehicle: 'TRK-1001', trip: 'TRP-8826', type: 'Toll', amount: 420, date: '2025-10-11' },
  ];

  // Maintenance Tab Mock Data
  const maintenanceChartData = [
    { name: 'TRK-1001', cost: 42000 },
    { name: 'TRK-1002', cost: 15500 },
    { name: 'VAN-2001', cost: 8900 },
    { name: 'TRK-1003', cost: 24000 },
    { name: 'TRK-1004', cost: 32000 },
  ];

  const maintenanceTableData = [
    { id: '1', vehicle: 'TRK-1001', type: 'Engine Overhaul', cost: 42000, status: 'In Shop', date: '2025-10-14' },
    { id: '2', vehicle: 'TRK-1002', type: 'Tire Replacement', cost: 15500, status: 'Resolved', date: '2025-10-10' },
    { id: '3', vehicle: 'VAN-2001', type: 'Brake Service', cost: 8900, status: 'Resolved', date: '2025-10-08' },
    { id: '4', vehicle: 'TRK-1003', type: 'Oil Change & Filter', cost: 24000, status: 'In Shop', date: '2025-10-15' },
    { id: '5', vehicle: 'TRK-1004', type: 'Transmission Check', cost: 32000, status: 'In Shop', date: '2025-10-16' },
  ];

  const tabs = ['KPIs Overview', 'Expenses', 'Maintenance', 'Fuel Efficiency'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Analytics & Reports</h1>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => toast.success('Exporting CSV...')}
            className="flex items-center px-3 py-2 bg-transparent border border-border-subtle rounded-md text-sm hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button 
            onClick={() => toast.success('Generating PDF...')}
            className="flex items-center px-3 py-2 bg-transparent border border-border-subtle rounded-md text-sm hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
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

      {isLoading ? (
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
      ) : (
        <>
          {activeTab === 'KPIs Overview' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Avg Fuel Efficiency" value="8.04 km/L" change="+2.4%" positive={true} icon={Activity} />
            <MetricCard title="Fleet Utilization" value="82%" change="+5.1%" positive={true} icon={Percent} />
            <MetricCard title="Total Revenue (Est)" value="$124,500" change="-1.2%" positive={false} icon={TrendingUp} />
            <MetricCard title="Avg Vehicle ROI" value="14.2%" change="+0.8%" positive={true} icon={DollarSign} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Top Cost by Vehicle ($)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCostData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                    <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#2F2F2F'}}
                      contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#E67E22" radius={[0, 0, 0, 0]} barSize={32} />
                    <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#3498DB" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Fuel Efficiency by Vehicle (km/L)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelEfficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                    <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#2F2F2F'}}
                      contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                    />
                    <Bar dataKey="efficiency" name="Efficiency" fill="#27AE60" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

      {activeTab === 'Expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Total Expenses" value="₹2,450,000" change="+4.2%" positive={false} icon={TrendingUp} />
            <MetricCard title="Fuel Cost" value="₹1,850,000" change="-1.5%" positive={true} icon={Activity} />
            <MetricCard title="Maintenance Cost" value="₹600,000" change="+12.0%" positive={false} icon={DollarSign} />
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-lg p-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Top Cost by Vehicle (₹)</h2>
              <button 
                onClick={() => toast.success('Exporting CSV...')}
                className="flex items-center px-3 py-1.5 bg-transparent border border-border-subtle rounded-md text-xs hover:bg-bg-hover text-text-secondary hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                  <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#2F2F2F'}}
                    contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                  />
                  <Bar dataKey="cost" name="Cost (₹)" fill="#E67E22" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                    <th className="px-6 py-4 font-semibold">Trip</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount (₹)</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesTableData.map((row) => (
                    <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                      <td className="px-6 py-2 font-medium">{row.vehicle}</td>
                      <td className="px-6 py-2 text-text-secondary">{row.trip}</td>
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
            <MetricCard title="Total Maintenance Cost" value="₹122,400" change="+8.5%" positive={false} icon={DollarSign} />
            <MetricCard title="Vehicles In Shop" value="3" change="-1" positive={true} icon={Activity} />
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
                    {maintenanceTableData.map((row) => (
                      <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-hover h-[44px]">
                        <td className="px-6 py-2 font-medium">{row.vehicle}</td>
                        <td className="px-6 py-2 text-text-secondary">{row.type}</td>
                        <td className="px-6 py-2 text-right font-medium text-accent">₹{row.cost.toLocaleString()}</td>
                        <td className="px-6 py-2"><StatusBadge status={row.status as 'In Shop' | 'Resolved'} /></td>
                        <td className="px-6 py-2 text-text-secondary">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Maintenance Cost by Vehicle (₹)</h2>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                    <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#2F2F2F'}}
                      contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                    />
                    <Bar dataKey="cost" name="Cost (₹)" fill="#E67E22" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {activeTab === 'Fuel Efficiency' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard title="Fleet Avg Efficiency" value="8.04 km/L" change="+2.4%" positive={true} icon={Activity} />
            <MetricCard title="Total Fuel Consumed" value="1,750 L" change="-5.1%" positive={true} icon={Activity} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-6">Fuel Efficiency by Vehicle (km/L)</h2>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelEfficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
                    <XAxis type="number" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#A0A0A0" fontSize={12} width={80} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#2F2F2F'}}
                      contentStyle={{ backgroundColor: '#242424', borderColor: '#333333', color: '#fff' }}
                    />
                    <Bar dataKey="efficiency" name="Efficiency (km/L)" fill="#E67E22" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                    {fuelEfficiencyTableData.map((row) => (
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
      )}

    </div>
  );
}

function MetricCard({ title, value, change, positive, icon: Icon }: { title: string, value: string, change: string, positive: boolean, icon: any }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-md bg-bg-input text-text-secondary">
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}
