import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService, vehicleService, driverService } from '../services/mockApi';
import { Trip, Vehicle, Driver } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Search, MapPin, Truck, Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function Trips() {
  const { role } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Trip form state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Complete Trip modal state
  const [completeModalTrip, setCompleteModalTrip] = useState<Trip | null>(null);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, vData, dData] = await Promise.all([
        tripService.getTrips(),
        vehicleService.getVehicles(),
        driverService.getDrivers()
      ]);
      setTrips(tData);
      setVehicles(vData);
      setDrivers(dData);
    } catch (e) {
      toast.error('Failed to load trips data');
    } finally {
      setIsLoading(false);
    }
  };

  const hasWriteAccess = role === 'fleet_manager' || role === 'dispatcher';

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d =>
    d.status === 'Available' && new Date(d.expiryDate) > new Date()
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const isOverCapacity = selectedVehicle && Number(cargoWeight) > selectedVehicle.capacity;

  const filteredTrips = trips.filter(t =>
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.route.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.route.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverCapacity) {
      toast.error('Cannot dispatch: Cargo weight exceeds vehicle capacity.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newTrip = await tripService.createTrip({
        source,
        destination,
        vehicle_id: Number(selectedVehicleId),
        driver_id: Number(selectedDriverId),
        cargo_weight: Number(cargoWeight),
        planned_distance: Number(plannedDistance),
      });
      setTrips(prev => [newTrip, ...prev]);
      // Refresh vehicles + drivers to reflect status changes
      const [vData, dData] = await Promise.all([vehicleService.getVehicles(), driverService.getDrivers()]);
      setVehicles(vData); setDrivers(dData);
      toast.success(`Trip ${newTrip.code} created!`);
      setSource(''); setDestination(''); setSelectedVehicleId('');
      setSelectedDriverId(''); setCargoWeight(''); setPlannedDistance('');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create trip';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (trip: Trip) => {
    try {
      const updated = await tripService.dispatch(trip.id);
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      const [vData, dData] = await Promise.all([vehicleService.getVehicles(), driverService.getDrivers()]);
      setVehicles(vData); setDrivers(dData);
      toast.success(`${trip.code} dispatched!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Dispatch failed');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTrip) return;
    setIsSubmitting(true);
    try {
      const updated = await tripService.complete(completeModalTrip.id, Number(finalOdometer), Number(fuelConsumed));
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      const [vData, dData] = await Promise.all([vehicleService.getVehicles(), driverService.getDrivers()]);
      setVehicles(vData); setDrivers(dData);
      toast.success(`${completeModalTrip.code} completed!`);
      setCompleteModalTrip(null);
      setFinalOdometer(''); setFuelConsumed('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Complete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (trip: Trip) => {
    try {
      const updated = await tripService.cancel(trip.id);
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      const [vData, dData] = await Promise.all([vehicleService.getVehicles(), driverService.getDrivers()]);
      setVehicles(vData); setDrivers(dData);
      toast.success(`${trip.code} cancelled`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Cancel failed');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
      {/* Left Panel - Live Trips */}
      <div className="flex-1 flex flex-col min-h-0 bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-input">
          <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Live Trips Board</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search code/city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-bg-primary border border-border-subtle rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center p-8 text-text-secondary">No trips found.</div>
          ) : (
            filteredTrips.map(trip => {
              const v = vehicles.find(x => x.id === trip.vehicleId);
              const d = drivers.find(x => x.id === trip.driverId);

              return (
                <div key={trip.id} className="bg-bg-primary border border-border-subtle rounded-lg p-4 transition-colors hover:border-accent/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs text-text-secondary">{trip.code}</span>
                      <h3 className="font-medium mt-1 flex items-center">
                        {trip.route.source} <span className="mx-2 text-text-secondary">&rarr;</span> {trip.route.destination}
                      </h3>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary mb-2">
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      <span className="truncate">{v?.regNo || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="truncate">{d?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  {hasWriteAccess && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border-subtle">
                      {trip.status === 'Pending' && (
                        <>
                          <button
                            className="flex-1 bg-accent hover:bg-accent-hover text-white py-1.5 rounded text-sm font-medium transition-colors"
                            onClick={() => handleDispatch(trip)}>
                            Dispatch
                          </button>
                          <button
                            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 py-1.5 rounded text-sm font-medium transition-colors"
                            onClick={() => handleCancel(trip)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {trip.status === 'Dispatched' && (
                        <>
                          <button
                            className="flex-1 bg-success hover:bg-success/80 text-white py-1.5 rounded text-sm font-medium transition-colors"
                            onClick={() => { setCompleteModalTrip(trip); setFinalOdometer(''); setFuelConsumed(''); }}>
                            Complete
                          </button>
                          <button
                            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 py-1.5 rounded text-sm font-medium transition-colors"
                            onClick={() => handleCancel(trip)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {(trip.status === 'Completed' || trip.status === 'Cancelled') && (
                        <div className="text-xs text-text-secondary italic pt-1">
                          {trip.status === 'Completed' ? '✓ Trip completed' : '✗ Trip cancelled'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Create Trip Form */}
      {hasWriteAccess && (
        <div className="w-full lg:w-[400px] flex flex-col min-h-0 bg-bg-card border border-border-subtle rounded-lg overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border-subtle bg-bg-input">
            <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">Create New Trip</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border-subtle -z-10 -translate-y-1/2"></div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold ring-4 ring-bg-card">1</div>
                <span className="text-[10px] uppercase mt-2 font-medium text-accent">Draft</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-bg-input border border-border-subtle text-text-secondary flex items-center justify-center text-xs font-bold ring-4 ring-bg-card">2</div>
                <span className="text-[10px] uppercase mt-2 font-medium text-text-secondary">Dispatched</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-bg-input border border-border-subtle text-text-secondary flex items-center justify-center text-xs font-bold ring-4 ring-bg-card">3</div>
                <span className="text-[10px] uppercase mt-2 font-medium text-text-secondary">Completed</span>
              </div>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase">Source</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input type="text" required value={source} onChange={e => setSource(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Origin City" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase">Destination</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input type="text" required value={destination} onChange={e => setDestination(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Destination City" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase">Vehicle</label>
                <select required value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  <option value="">Select Available Vehicle</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.regNo} - {v.name} ({v.capacity}kg max)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary uppercase">Driver</label>
                <select required value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  <option value="">Select Available Driver</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Score: {d.safetyScore})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Cargo Weight (kg)</label>
                  <input type="number" required min="1" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Distance (km)</label>
                  <input type="number" required min="1" value={plannedDistance} onChange={e => setPlannedDistance(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
                </div>
              </div>

              {selectedVehicle && cargoWeight && (
                <div className={`p-3 rounded border text-sm mt-4 flex flex-col space-y-1 ${isOverCapacity ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-success/10 border-success/30 text-success'}`}>
                  <div className="flex justify-between">
                    <span>Vehicle Capacity:</span>
                    <span className="font-semibold">{selectedVehicle.capacity} Kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cargo Weight:</span>
                    <span className="font-semibold">{cargoWeight} Kg</span>
                  </div>
                  {isOverCapacity && <div className="mt-1 font-bold text-xs">EXCEEDS LIMIT!</div>}
                </div>
              )}

              <button
                type="submit"
                disabled={isOverCapacity || !selectedVehicleId || !selectedDriverId || isSubmitting}
                className="w-full flex items-center justify-center bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent text-white font-medium py-2.5 rounded-md transition-colors mt-6"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Trip'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      <Modal isOpen={!!completeModalTrip} onClose={() => setCompleteModalTrip(null)} title={`Complete ${completeModalTrip?.code}`}>
        <form onSubmit={handleComplete} className="space-y-4">
          <p className="text-sm text-text-secondary">Enter final trip details to mark as completed and release vehicle & driver.</p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Final Odometer (km)</label>
            <input type="number" required min="0" value={finalOdometer} onChange={e => setFinalOdometer(e.target.value)}
              className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. 57500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase">Fuel Consumed (liters)</label>
            <input type="number" required min="0" step="0.1" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)}
              className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g. 45.5" />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-success hover:bg-success/80 disabled:opacity-50 text-white font-medium py-2 rounded-md transition-colors">
              {isSubmitting ? 'Completing...' : 'Confirm Completion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
