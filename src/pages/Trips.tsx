import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService, vehicleService, driverService } from '../services/mockApi';
import { Trip, Vehicle, Driver } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Search, MapPin, Truck, Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { TripMapModal } from '../components/TripMapModal';
import { getCoordinates, haversineDistance } from '../utils/location';

export function Trips() {
  const { role } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [viewTripId, setViewTripId] = useState<string | null>(null);

  // Form State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [isManualDistance, setIsManualDistance] = useState(false);

  useEffect(() => {
    if (!isManualDistance && source && destination) {
      const srcCoords = getCoordinates(source);
      const destCoords = getCoordinates(destination);
      if (srcCoords && destCoords) {
        const dist = haversineDistance(srcCoords.lat, srcCoords.lng, destCoords.lat, destCoords.lng);
        setPlannedDistance(dist.toString());
      }
    }
  }, [source, destination, isManualDistance]);

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

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverCapacity) {
      toast.error('Cannot dispatch: Cargo weight exceeds vehicle capacity.');
      return;
    }
    try {
      await tripService.createTrip({
        source,
        destination,
        vehicleId: Number(selectedVehicleId),
        driverId: Number(selectedDriverId),
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDistance)
      });
      toast.success('Trip created successfully!');
      // Reset form
      setSource('');
      setDestination('');
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setCargoWeight('');
      setPlannedDistance('');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to create trip';
      toast.error(msg);
    }
  };

  const handleDispatchTrip = async (id: string) => {
    try {
      await tripService.dispatchTrip(id);
      toast.success('Trip dispatched successfully!');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to dispatch trip';
      toast.error(msg);
    }
  };

  const handleCompleteTrip = async (id: string, currentOdometer: number) => {
    const finalOdoStr = prompt('Enter final odometer reading (km):', String(currentOdometer + 50));
    if (finalOdoStr === null) return;
    const finalOdo = Number(finalOdoStr);
    if (isNaN(finalOdo) || finalOdo < currentOdometer) {
      toast.error('Invalid odometer reading');
      return;
    }

    const fuelStr = prompt('Enter fuel consumed (liters):', '10');
    if (fuelStr === null) return;
    const fuel = Number(fuelStr);
    if (isNaN(fuel) || fuel < 0) {
      toast.error('Invalid fuel reading');
      return;
    }

    try {
      await tripService.completeTrip(id, { finalOdometer: finalOdo, fuelConsumed: fuel });
      toast.success('Trip completed successfully!');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.detail || err.response?.data?.detail || 'Failed to complete trip';
      toast.error(msg);
    }
  };

  const getStepStatus = (status: string) => {
    if (status === 'Cancelled') return 'cancelled';
    if (status === 'Draft' || status === 'Pending') return 'draft';
    if (status === 'Dispatched') return 'dispatched';
    if (status === 'Completed') return 'completed';
    return 'draft';
  };

  const activeTrip = trips.find(t => t.id === selectedTripId) || null;
  const mapTrip = trips.find(t => t.id === viewTripId) || null;

  const renderStepIndicator = () => {
    const status = activeTrip ? getStepStatus(activeTrip.status) : 'draft';

    if (status === 'cancelled') {
      return (
        <div className="flex items-center justify-center mb-8">
          <div className="px-4 py-2 bg-danger/10 border border-danger/30 text-danger rounded-md font-medium text-sm flex items-center">
            <span className="w-2 h-2 rounded-full bg-danger mr-2"></span>
            Trip Cancelled
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between mb-8 relative px-4">
        <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-border-subtle -z-10 -translate-y-1/2"></div>
        
        {/* Draft */}
        <div className="flex flex-col items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-bg-card transition-colors ${status === 'draft' || status === 'dispatched' || status === 'completed' ? 'bg-accent text-white' : 'bg-bg-input border border-border-subtle text-text-secondary'}`}>
            1
          </div>
          <span className={`text-[10px] uppercase mt-2 font-medium ${status === 'draft' || status === 'dispatched' || status === 'completed' ? 'text-accent' : 'text-text-secondary'}`}>Draft</span>
        </div>

        {/* Dispatched */}
        <div className="flex flex-col items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-bg-card transition-colors ${status === 'dispatched' || status === 'completed' ? 'bg-accent text-white' : 'bg-bg-input border border-border-subtle text-text-secondary'}`}>
            2
          </div>
          <span className={`text-[10px] uppercase mt-2 font-medium ${status === 'dispatched' || status === 'completed' ? 'text-accent' : 'text-text-secondary'}`}>Dispatched</span>
        </div>

        {/* Completed */}
        <div className="flex flex-col items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-bg-card transition-colors ${status === 'completed' ? 'bg-success text-white' : 'bg-bg-input border border-border-subtle text-text-secondary'}`}>
            3
          </div>
          <span className={`text-[10px] uppercase mt-2 font-medium ${status === 'completed' ? 'text-success' : 'text-text-secondary'}`}>Completed</span>
        </div>
      </div>
    );
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
              placeholder="Search code..."
              className="bg-bg-primary border border-border-subtle rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
          ) : trips.length === 0 ? (
            <div className="text-center p-8 text-text-secondary">No records yet.</div>
          ) : (
            trips.map(trip => {
              const v = vehicles.find(x => x.id === trip.vehicleId);
              const d = drivers.find(x => x.id === trip.driverId);
              
              return (
                <div 
                  key={trip.id} 
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`bg-bg-primary border rounded-lg p-4 transition-colors cursor-pointer ${selectedTripId === trip.id ? 'border-accent ring-1 ring-accent' : 'border-border-subtle hover:border-accent/50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs text-text-secondary">{trip.code}</span>
                      <h3 className="font-medium mt-1 flex items-center">
                        {trip.route.source} <span className="mx-2 text-text-secondary">&rarr;</span> {trip.route.destination}
                      </h3>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary mb-4">
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
                        <button className="flex-1 bg-accent hover:bg-accent-hover text-white py-1.5 rounded text-sm font-medium transition-colors" onClick={(e) => { e.stopPropagation(); handleDispatchTrip(trip.id); }}>Dispatch</button>
                      )}
                      {trip.status === 'Dispatched' && (
                        <button className="flex-1 bg-success hover:bg-success/80 text-white py-1.5 rounded text-sm font-medium transition-colors" onClick={(e) => { e.stopPropagation(); handleCompleteTrip(trip.id, v?.odometer || 0); }}>Complete</button>
                      )}
                      <button className="flex-1 bg-bg-input hover:bg-bg-hover text-white py-1.5 rounded text-sm font-medium transition-colors border border-border-subtle" onClick={(e) => { e.stopPropagation(); setViewTripId(trip.id); }}>View</button>
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
          <div className="p-4 border-b border-border-subtle bg-bg-input flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase text-text-secondary tracking-wider">
              {activeTrip ? `Trip Details: ${activeTrip.code}` : 'Create New Trip'}
            </h2>
            {activeTrip && (
              <button onClick={() => setSelectedTripId(null)} className="text-xs text-accent hover:underline font-medium">
                + New Trip
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {/* Step Indicator */}
            {renderStepIndicator()}

            {activeTrip ? (
              <div className="space-y-4">
                <div className="bg-bg-input p-4 rounded-md border border-border-subtle">
                  <p className="text-sm text-text-secondary mb-2">Route</p>
                  <p className="font-medium">{activeTrip.route.source} &rarr; {activeTrip.route.destination}</p>
                </div>
                <div className="bg-bg-input p-4 rounded-md border border-border-subtle">
                  <p className="text-sm text-text-secondary mb-2">Metrics</p>
                  <p className="font-medium text-sm">Cargo: {activeTrip.cargoWeight} kg</p>
                  <p className="font-medium text-sm">Planned Dist: {activeTrip.plannedDistance} km</p>
                  {activeTrip.status === 'Completed' && (
                    <>
                      <p className="font-medium text-sm mt-2 text-success">Actual Dist: {activeTrip.actualDistance ?? '-'} km</p>
                      <p className="font-medium text-sm text-success">Fuel Consumed: {activeTrip.fuelConsumed ?? '-'} L</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Source</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" required value={source} onChange={e => setSource(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Origin City" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Destination</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" required value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Destination City" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Vehicle</label>
                  <select required value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                    <option value="">Select Available Vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.regNo} - {v.name} ({v.capacity}kg max)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase">Driver</label>
                  <select required value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent">
                    <option value="">Select Available Driver</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (Score: {d.safetyScore})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary uppercase">Cargo Weight (kg)</label>
                    <input type="number" required min="1" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="0" />
                  </div>
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-text-secondary uppercase">Distance (km)</label>
                      <button 
                        type="button"
                        onClick={() => setIsManualDistance(!isManualDistance)}
                        className="text-[10px] text-accent hover:underline"
                      >
                        {isManualDistance ? 'Use estimated' : 'Enter manually'}
                      </button>
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={plannedDistance} 
                      onChange={e => {
                        setPlannedDistance(e.target.value);
                        if (!isManualDistance) setIsManualDistance(true);
                      }} 
                      readOnly={!isManualDistance}
                      className={`w-full border border-border-subtle rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent ${!isManualDistance ? 'bg-bg-card text-text-secondary cursor-not-allowed' : 'bg-bg-input'}`} 
                      placeholder="0" 
                    />
                    {!isManualDistance && (
                      <p className="text-[10px] text-text-secondary mt-1">Straight-line distance (est.)</p>
                    )}
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
                    {isOverCapacity && (
                      <div className="mt-1 font-bold text-xs">EXCEEDS LIMIT!</div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isOverCapacity || !selectedVehicleId || !selectedDriverId}
                  className="w-full flex items-center justify-center bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent text-white font-medium py-2.5 rounded-md transition-colors mt-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Dispatch Trip
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {hasWriteAccess && (
        <TripMapModal 
          isOpen={viewTripId !== null} 
          onClose={() => setViewTripId(null)} 
          trip={mapTrip} 
          vehicle={vehicles.find(v => v.id === mapTrip?.vehicleId)} 
          driver={drivers.find(d => d.id === mapTrip?.driverId)} 
        />
      )}
    </div>
  );
}
