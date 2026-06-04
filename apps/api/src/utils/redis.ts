import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);
export const pubClient = new Redis(redisUrl);
export const subClient = new Redis(redisUrl);

export async function setOtp(phone: string, otp: string, ttl = 600): Promise<void> {
  await redis.setex(`otp:${phone}`, ttl, otp);
}

export async function getOtp(phone: string): Promise<string | null> {
  return redis.get(`otp:${phone}`);
}

export async function deleteOtp(phone: string): Promise<void> {
  await redis.del(`otp:${phone}`);
}

export async function setDriverLocation(driverId: string, lat: number, lng: number, heading?: number): Promise<void> {
  await redis.setex(
    `driver:loc:${driverId}`,
    120,
    JSON.stringify({ lat, lng, heading, timestamp: Date.now() })
  );
}

export async function getDriverLocation(driverId: string) {
  const raw = await redis.get(`driver:loc:${driverId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function setRefreshToken(token: string, userId: string, ttl: number): Promise<void> {
  await redis.setex(`rt:${token}`, ttl, userId);
}

export async function getRefreshToken(token: string): Promise<string | null> {
  return redis.get(`rt:${token}`);
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await redis.del(`rt:${token}`);
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}
