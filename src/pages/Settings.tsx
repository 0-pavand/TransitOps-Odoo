import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/mockApi';
import { User } from '../types';
import { Plus, Save, User as UserIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Real users from backend
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  // Add user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await settingsService.getUsers();
      setUsers(data);
    } catch {
      // silently fail if not fleet manager — other roles can't see users
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<'Users & Roles' | 'General Settings' | 'Integrations'>('Users & Roles');

  // General Settings states
  const [companyName, setCompanyName] = useState('Apex Logistics');
  const [timezone, setTimezone] = useState('Asia/Kolkata (UTC+05:30)');
  const [currency, setCurrency] = useState('₹ INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  const [capacityUnit, setCapacityUnit] = useState<'Kg' | 'Ton'>('Kg');
  const [expiryThreshold, setExpiryThreshold] = useState('30');
  const [retireYears, setRetireYears] = useState('15');

  const [emailMaintenance, setEmailMaintenance] = useState(true);
  const [emailLicense, setEmailLicense] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  // Integrations states
  const [integrations, setIntegrations] = useState([
    { id: 'smtp', name: 'Email/SMTP', desc: 'For notification delivery', status: 'Not Connected', initial: 'E' },
    { id: 'sms', name: 'SMS Gateway', desc: 'For driver alerts', status: 'Not Connected', initial: 'S' },
    { id: 'maps', name: 'Google Maps API', desc: 'For route distance calc', status: 'Connected', initial: 'G' },
    { id: 'payment', name: 'Payment Gateway', desc: 'For expense reconciliation', status: 'Not Connected', initial: 'P' },
    { id: 'export', name: 'Export Service (PDF/CSV)', desc: 'For reports export', status: 'Connected', initial: 'X' },
    { id: 'webhook', name: 'Webhook', desc: 'For external system sync', status: 'Not Connected', initial: 'W' },
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<{ id: string, name: string } | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('RBAC Settings saved successfully');
    }, 800);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.createUser({
        name: newName,
        email: newEmail,
        role: newRole,
        department: newDepartment,
        password: newPassword,
      });
      toast.success('User added successfully');
      setIsAddUserModalOpen(false);
      setNewName(''); setNewEmail(''); setNewRole(''); setNewDepartment(''); setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to add user';
      toast.error(msg);
    }
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Organization details saved successfully!');
    }, 600);
  };

  const handleSaveFleet = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Fleet preferences saved successfully!');
    }, 600);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Notification preferences saved successfully!');
    }, 600);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;
    
    setIntegrations(prev => prev.map(item => {
      if (item.id === selectedIntegration.id) {
        return { ...item, status: 'Connected' };
      }
      return item;
    }));
    
    toast.success(`${selectedIntegration.name} connected successfully!`);
    setIsConnectModalOpen(false);
    setSelectedIntegration(null);
  };

  const handleDisconnect = (id: string, name: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Not Connected' };
      }
      return item;
    }));
    toast.success(`${name} disconnected.`);
  };

  const getInitialsBg = (initial: string) => {
    switch (initial) {
      case 'E': return 'bg-info/10 text-info border-info/20';
      case 'S': return 'bg-warning/10 text-warning border-warning/20';
      case 'G': return 'bg-success/10 text-success border-success/20';
      case 'P': return 'bg-danger/10 text-danger border-danger/20';
      case 'X': return 'bg-accent/10 text-accent border-accent/20';
      case 'W': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="flex border-b border-border-subtle overflow-x-auto">
        {(['Users & Roles', 'General Settings', 'Integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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

      {activeTab === 'Users & Roles' && (
        <div className="flex flex-col max-w-3xl gap-6">
          
          {/* Left: User List */}
          <div className="w-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">System Users</h2>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add User
              </button>
            </div>
            
            <div className="space-y-3">
              {isUsersLoading ? (
                <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div></div>
              ) : users.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">No users found.</p>
              ) : users.map(user => (
                <div key={user.id} className="bg-bg-card border border-border-subtle rounded-lg p-4 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-medium bg-bg-input px-2 py-0.5 rounded text-text-secondary border border-border-subtle">
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded border ${user.status === 'Active' ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'General Settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Left Column: Org & Fleet */}
          <div className="space-y-6">
            {/* Organization Details */}
            <form onSubmit={handleSaveOrg} className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border-subtle bg-bg-input">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Organization Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    placeholder="e.g. Apex Logistics"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    >
                      <option value="Asia/Kolkata (UTC+05:30)">Asia/Kolkata (UTC+05:30)</option>
                      <option value="UTC (UTC+00:00)">UTC (UTC+00:00)</option>
                      <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                      <option value="Europe/London (UTC+01:00)">Europe/London (UTC+01:00)</option>
                      <option value="Asia/Singapore (UTC+08:00)">Asia/Singapore (UTC+08:00)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Default Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    >
                      <option value="₹ INR">₹ INR</option>
                      <option value="$ USD">$ USD</option>
                      <option value="€ EUR">€ EUR</option>
                      <option value="£ GBP">£ GBP</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 11/07/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/11/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-11)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>

            {/* Fleet Preferences */}
            <form onSubmit={handleSaveFleet} className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border-subtle bg-bg-input">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Fleet Preferences</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Default Vehicle Capacity Unit</label>
                  <div className="flex bg-bg-input p-1 rounded-md border border-border-subtle w-fit">
                    <button
                      type="button"
                      onClick={() => setCapacityUnit('Kg')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${capacityUnit === 'Kg' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      Kilograms (Kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapacityUnit('Ton')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${capacityUnit === 'Ton' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      Metric Tons (Ton)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Expiry Warning Threshold (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="365"
                      value={expiryThreshold}
                      onChange={(e) => setExpiryThreshold(e.target.value)}
                      className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Auto-Retire Vehicles (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={retireYears}
                      onChange={(e) => setRetireYears(e.target.value)}
                      className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Notification Preferences */}
          <div>
            <form onSubmit={handleSaveNotifications} className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-border-subtle bg-bg-input">
                <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Notification Preferences</h2>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4 divide-y divide-border-subtle">
                  {/* Switch 1 */}
                  <div className="flex items-center justify-between py-4 first:pt-0">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-white">Email alerts on maintenance</p>
                      <p className="text-xs text-text-secondary mt-1">Receive immediate automated alerts when a new vehicle maintenance log is entered or updated.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailMaintenance(!emailMaintenance)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailMaintenance ? 'bg-accent' : 'bg-bg-input'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailMaintenance ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Switch 2 */}
                  <div className="flex items-center justify-between py-4">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-white">Email alerts on license expiry</p>
                      <p className="text-xs text-text-secondary mt-1">Receive warning alerts for any drivers whose license is expiring within the configured threshold days.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailLicense(!emailLicense)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailLicense ? 'bg-accent' : 'bg-bg-input'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailLicense ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Switch 3 */}
                  <div className="flex items-center justify-between py-4">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-white">Dashboard sound alerts</p>
                      <p className="text-xs text-text-secondary mt-1">Play responsive sound notification cues on critical system warnings or new critical notifications.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundAlerts(!soundAlerts)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${soundAlerts ? 'bg-accent' : 'bg-bg-input'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${soundAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle mt-auto">
                  <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'Integrations' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const isConnected = integration.status === 'Connected';
              return (
                <div key={integration.id} className="bg-bg-card border border-border-subtle rounded-lg p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 ${getInitialsBg(integration.initial)}`}>
                        {integration.initial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{integration.name}</h3>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{integration.desc}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isConnected 
                        ? 'bg-success/10 border border-success/30 text-success' 
                        : 'bg-bg-input border border-border-subtle text-text-secondary'
                    }`}>
                      {integration.status}
                    </span>
                  </div>

                  <div className="pt-2">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(integration.id, integration.name)}
                        className="w-full text-center py-1.5 px-3 border border-danger text-danger hover:bg-danger hover:text-white transition-colors text-xs font-semibold rounded-md"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setApiKey('');
                          setIsConnectModalOpen(true);
                        }}
                        className="w-full text-center py-1.5 px-3 border border-accent text-accent hover:bg-accent hover:text-white transition-colors text-xs font-semibold rounded-md"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connect Integration Modal */}
          <Modal 
            isOpen={isConnectModalOpen} 
            onClose={() => {
              setIsConnectModalOpen(false);
              setSelectedIntegration(null);
            }} 
            title={`Connect ${selectedIntegration?.name}`}
          >
            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <p className="text-xs text-text-secondary">
                To connect {selectedIntegration?.name}, enter your API access credentials. This configuration is stored securely.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase">API Key / Access Token</label>
                <input 
                  type="password" 
                  required 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" 
                  placeholder="e.g. sk_live_..." 
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-md transition-colors text-sm">
                  Save & Connect
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add System User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Full Name</label>
            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Alice Smith" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Email Address</label>
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="alice@example.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Department</label>
            <input type="text" value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. Operations" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Role</label>
            <select required value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">Select Role</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="safety_officer">Safety Officer</option>
              <option value="financial_analyst">Financial Analyst</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Password</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Temporary password" />
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-md transition-colors">
              Save User
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

function RBACRow({ feature, roles }: { feature: string, roles: boolean[] }) {
  return (
    <tr className="hover:bg-bg-hover">
      <td className="px-4 py-3 font-medium text-text-secondary">{feature}</td>
      {roles.map((hasAccess, idx) => (
        <td key={idx} className="px-4 py-3 text-center">
          <input 
            type="checkbox" 
            defaultChecked={hasAccess}
            className="rounded border-border-subtle bg-bg-input text-accent focus:ring-accent/50 cursor-pointer" 
          />
        </td>
      ))}
    </tr>
  );
}
