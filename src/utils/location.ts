export interface Coordinates {
  lat: number;
  lng: number;
}

const CITIES: Record<string, Coordinates> = {
  nagercoil: { lat: 8.1833, lng: 77.4119 },
  tada: { lat: 13.5937, lng: 80.0210 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  newdelhi: { lat: 28.7041, lng: 77.1025 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  mysore: { lat: 12.2958, lng: 76.6394 },
};

export function getCoordinates(city: string): Coordinates | null {
  if (!city) return null;
  const normalized = city.trim().toLowerCase().replace(/\s+/g, '');
  
  // Exact match
  if (CITIES[normalized]) {
    return CITIES[normalized];
  }

  // Fuzzy match
  for (const [key, coords] of Object.entries(CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return null;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * 
            Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
