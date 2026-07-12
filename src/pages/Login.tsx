import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Truck } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('fleet@transitops.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, role } = useAuth();

  if (role) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-bg-primary text-text-primary">
      {/* Left side - Info */}
      <div className="hidden lg:flex w-1/2 bg-bg-sidebar border-r border-border-subtle p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Truck className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">TransitOps</h1>
          </div>
          <p className="text-text-secondary text-lg max-w-md">
            Smart Transport Operations Platform. Streamline your fleet, drivers, and trips in real-time.
          </p>
        </div>

        <div className="space-y-6 max-w-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Demo Roles</h3>
          <div className="space-y-4">
            <div className="bg-bg-card p-4 rounded-lg border border-border-subtle">
              <p className="font-medium">Fleet Manager</p>
              <p className="text-xs text-text-secondary mt-1">fleet@transitops.com</p>
              <p className="text-xs text-text-secondary mt-2">Full access to all modules, settings, and fleet management.</p>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-border-subtle">
              <p className="font-medium">Dispatcher</p>
              <p className="text-xs text-text-secondary mt-1">dispatch@transitops.com</p>
              <p className="text-xs text-text-secondary mt-2">Manage trips and dispatch vehicles. View-only access to fleet & drivers.</p>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-border-subtle">
              <p className="font-medium">Safety Officer</p>
              <p className="text-xs text-text-secondary mt-1">safety@transitops.com</p>
              <p className="text-xs text-text-secondary mt-2">Manage drivers, track safety scores and licenses.</p>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-border-subtle">
              <p className="font-medium">Financial Analyst</p>
              <p className="text-xs text-text-secondary mt-1">finance@transitops.com</p>
              <p className="text-xs text-text-secondary mt-2">View analytics and manage expenses/fuel costs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-text-secondary">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-danger/10 border-l-4 border-danger p-4 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg-input border border-border-subtle rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border-subtle bg-bg-input text-accent focus:ring-accent/50" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
