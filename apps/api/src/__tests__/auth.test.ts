import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe('Auth — User OTP flow', () => {
  const phone = '+919876543210';

  it('sends OTP to valid phone', async () => {
    const res = await request(app).post('/api/auth/user/send-otp').send({ phone });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects invalid phone', async () => {
    const res = await request(app).post('/api/auth/user/send-otp').send({ phone: '12345' });
    expect(res.status).toBe(400);
  });

  it('verifies OTP and returns JWT', async () => {
    await redis.setex(`otp:${phone}`, 600, '123456');
    const res = await request(app).post('/api/auth/user/verify-otp').send({ phone, otp: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects wrong OTP', async () => {
    await redis.setex(`otp:${phone}`, 600, '654321');
    const res = await request(app).post('/api/auth/user/verify-otp').send({ phone, otp: '000000' });
    expect(res.status).toBe(400);
  });
});

describe('Auth — Admin login', () => {
  it('returns token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/admin/login').send({ email: 'admin@transitco.in', password: 'Admin@123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/admin/login').send({ email: 'admin@transitco.in', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
