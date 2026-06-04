import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

afterAll(async () => { await prisma.$disconnect(); await redis.quit(); });

describe('Ride — Fare Estimate', () => {
  it('returns fare estimate for valid inputs', async () => {
    const res = await request(app).post('/api/rides/estimate').send({
      pickupLat: 12.9716, pickupLng: 77.5946,
      dropLat: 12.9352, dropLng: 77.6245,
      vehicleType: 'AUTO', city: 'Bangalore',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.estimatedFare).toBeGreaterThan(0);
    expect(res.body.data.distance).toBeGreaterThan(0);
  });

  it('returns 404 for unknown city', async () => {
    const res = await request(app).post('/api/rides/estimate').send({
      pickupLat: 12.9716, pickupLng: 77.5946, dropLat: 12.9352, dropLng: 77.6245,
      vehicleType: 'AUTO', city: 'UnknownCity',
    });
    expect(res.status).toBe(404);
  });
});
