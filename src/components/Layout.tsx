import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  Fuel, 
  BarChart3, 
  Settings,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { name: 'Fleet', path: '/fleet', icon: Truck, roles: ['fleet_manager', 'dispatcher'] },
  { name: 'Drivers', path: '/drivers', icon: Users, roles: ['fleet_manager', 'dispatcher', 'safety_officer'] },
  { name: 'Trips', path: '/trips', icon: Map, roles: ['fleet_manager', 'dispatcher', 'safety_officer'] },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['fleet_manager'] },
  { name: 'Fuel & Expenses', path: '/expenses', icon: Fuel, roles: ['fleet_manager', 'dispatcher', 'financial_analyst'] },
  { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['fleet_manager', 'safety_officer', 'financial_analyst'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['fleet_manager'] },
];

export function Layout() {
  const { role, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const allowedNavItems = navItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="flex h-screen w-full bg-bg-primary text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[200px] flex-shrink-0 bg-bg-sidebar border-r border-border-subtle flex flex-col">
        <div className="h-12 flex items-center px-4 border-b border-border-subtle">
          <div className="w-6 h-6 bg-accent rounded text-white flex items-center justify-center font-bold text-sm mr-2">T</div>
          <span className="font-semibold tracking-tight text-white">TransitOps</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {allowedNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                isActive 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-secondary hover:text-white hover:bg-bg-hover"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="mb-4">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-text-secondary capitalize truncate">{user?.role.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-text-secondary rounded-md hover:text-white hover:bg-bg-hover transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-12 flex-shrink-0 border-b border-border-subtle bg-bg-primary flex items-center px-6 justify-between">
          <div className="text-sm text-text-secondary">
            Smart Transport Operations Platform
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-xs text-text-secondary">System Online</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
