import React, { useEffect } from 'react';
import { Modal } from './Modal';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StatusBadge } from './StatusBadge';

// Mock coordinates for common cities
const CITY_COORDS: Record<string, [number, number]> = {
  'Nagercoil': [8.1833, 77.4119],
  'Tada': [13.5833, 80.0333],
  'Chennai': [13.0827, 80.2707],
  'Bangalore': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Kochi': [9.9312, 76.2673]
};
const FALLBACK_COORD: [number, number] = [20.5937, 78.9629]; // Center of India

const createPinIcon = (color: string) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="color: ${color};"><svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const sourceIcon = createPinIcon('#10B981'); // success/green
const destIcon = createPinIcon('#EF4444'); // danger/red

function MapBoundsFitter({ sourceCoords, destCoords }: { sourceCoords: [number, number], destCoords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([sourceCoords, destCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, sourceCoords, destCoords]);
  return null;
}

interface TripMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any | null;
  vehicle: any | null;
  driver: any | null;
}

export function TripMapModal({ isOpen, onClose, trip, vehicle, driver }: TripMapModalProps) {
  if (!trip) return null;

  const sourceCoords = CITY_COORDS[trip.route.source] || FALLBACK_COORD;
  const destCoords = CITY_COORDS[trip.route.destination] || FALLBACK_COORD;

  const title = (
    <div className="flex items-center gap-3">
      <span>{trip.code}</span>
      <StatusBadge status={trip.status} />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="h-[400px] rounded-lg overflow-hidden border border-border-subtle relative z-0">
          <MapContainer 
            center={sourceCoords} 
            zoom={5} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={sourceCoords} icon={sourceIcon} />
            <Marker position={destCoords} icon={destIcon} />
            <Polyline positions={[sourceCoords, destCoords]} pathOptions={{ color: '#E67E22', weight: 3, dashArray: '5, 10' }} />
            <MapBoundsFitter sourceCoords={sourceCoords} destCoords={destCoords} />
          </MapContainer>
        </div>

        <div className="bg-bg-input rounded-lg p-4 border border-border-subtle grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-text-secondary text-xs uppercase mb-1">Vehicle</p>
            <p className="font-medium">{vehicle?.regNo || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase mb-1">Driver</p>
            <p className="font-medium truncate">{driver?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase mb-1">Cargo</p>
            <p className="font-medium">{trip.cargoWeight} kg</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase mb-1">Planned Dist</p>
            <p className="font-medium">{trip.plannedDistance} km</p>
          </div>
          {trip.status === 'Completed' && (
            <div>
              <p className="text-text-secondary text-xs uppercase mb-1">Actual Dist / Fuel</p>
              <p className="font-medium">{trip.metrics?.distanceCovered} km / {trip.metrics?.fuelConsumed}L</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
