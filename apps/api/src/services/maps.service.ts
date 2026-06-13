import axios from 'axios';
import { cacheGet, cacheSet } from '../utils/redis';

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export interface DistanceResult {
  distanceKm: number;
  durationMin: number;
}

async function haversineFallback(oLat: number, oLng: number, dLat: number, dLng: number): Promise<DistanceResult> {
  const { haversineDistance } = await import('@transit/shared');
  const km = haversineDistance(oLat, oLng, dLat, dLng);
  return { distanceKm: km, durationMin: Math.round(km * 3) };
}

export async function getDistanceMatrix(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<DistanceResult> {
  const cacheKey = `maps:dist:${originLat.toFixed(4)},${originLng.toFixed(4)}-${destLat.toFixed(4)},${destLng.toFixed(4)}`;
  const cached = await cacheGet<DistanceResult>(cacheKey);
  if (cached) return cached;

  if (!MAPS_KEY || process.env.NODE_ENV === 'development') {
    return haversineFallback(originLat, originLng, destLat, destLng);
  }

  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${originLat},${originLng}`,
        destinations: `${destLat},${destLng}`,
        key: MAPS_KEY,
      },
      timeout: 5000,
    });

    const element = res.data.rows?.[0]?.elements?.[0];
    if (res.data.status !== 'OK' || element?.status !== 'OK') {
      return haversineFallback(originLat, originLng, destLat, destLng);
    }

    const result: DistanceResult = {
      distanceKm: element.distance.value / 1000,
      durationMin: Math.ceil(element.duration.value / 60),
    };
    await cacheSet(cacheKey, result, 86400);
    return result;
  } catch {
    return haversineFallback(originLat, originLng, destLat, destLng);
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `maps:rgeo:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  if (!MAPS_KEY || process.env.NODE_ENV === 'development') {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: MAPS_KEY, result_type: 'street_address|route|sublocality' },
      timeout: 5000,
    });
    if (res.data.status !== 'OK') return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const address = res.data.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    await cacheSet(cacheKey, address, 86400);
    return address;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export async function placesAutocomplete(input: string, lat?: number, lng?: number): Promise<any[]> {
  if (!MAPS_KEY) return [];
  try {
    const params: any = { input, key: MAPS_KEY, components: 'country:in', language: 'en', types: 'geocode|establishment' };
    if (lat && lng) { params.location = `${lat},${lng}`; params.radius = 50000; }
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', { params, timeout: 5000 });
    if (res.data.status === 'OK' || res.data.status === 'ZERO_RESULTS') return res.data.predictions || [];
    return [];
  } catch {
    return [];
  }
}

export async function placeDetails(placeId: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!MAPS_KEY) return null;
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: { place_id: placeId, key: MAPS_KEY, fields: 'geometry,formatted_address' },
      timeout: 5000,
    });
    const loc = res.data.result?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng, address: res.data.result.formatted_address || '' };
  } catch {
    return null;
  }
}
