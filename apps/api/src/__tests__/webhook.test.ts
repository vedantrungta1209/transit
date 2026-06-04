import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

afterAll(async () => { await prisma.$disconnect(); await redis.quit(); });

describe('Razorpay Webhook', () => {
  it('rejects webhook with invalid signature', async () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'x', id: 'y' } } } });
    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'invalidsig')
      .send(payload);
    expect(res.status).toBe(401);
  });

  it('accepts webhook with valid signature', async () => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'test_order', id: 'pay_test', notes: { receipt: 'unknown_receipt' }, amount: 10000 } } } });
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(payload);
    expect(res.status).toBe(200);
  });
});
