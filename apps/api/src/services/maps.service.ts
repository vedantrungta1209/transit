import axios from 'axios';
import { cacheGet, cacheSet } from '../utils/redis';

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export interface DistanceResult {
  distanceKm: number;
  durationMin: number;
}

export async function getDistanceMatrix(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<DistanceResult> {
  const cacheKey = `maps:dist:${originLat.toFixed(4)},${originLng.toFixed(4)}-${destLat.toFixed(4)},${destLng.toFixed(4)}`;
  const cached = await cacheGet<DistanceResult>(cacheKey);
  if (cached) return cached;

  if (!MAPS_KEY || process.env.NODE_ENV === 'development') {
    const { haversineDistance } = await import('@transit/shared');
    const km = haversineDistance(originLat, originLng, destLat, destLng);
    return { distanceKm: km, durationMin: Math.round(km * 3) };
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
  const res = await axios.get(url, {
    params: {
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      key: MAPS_KEY,
    },
  });

  const element = res.data.rows[0]?.elements[0];
  if (element?.status !== 'OK') throw new Error('Distance matrix failed');

  const result: DistanceResult = {
    distanceKm: element.distance.value / 1000,
    durationMin: Math.ceil(element.duration.value / 60),
  };
  await cacheSet(cacheKey, result, 86400);
  return result;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `maps:rgeo:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  if (!MAPS_KEY || process.env.NODE_ENV === 'development') {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { latlng: `${lat},${lng}`, key: MAPS_KEY },
  });
  const address = res.data.results[0]?.formatted_address || `${lat},${lng}`;
  await cacheSet(cacheKey, address, 86400);
  return address;
}
