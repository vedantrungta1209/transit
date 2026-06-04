import { calculateSubscriptionPrice } from '../services/subscription-engine.service';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

afterAll(async () => { await prisma.$disconnect(); await redis.quit(); });

describe('Subscription Engine', () => {
  const PLAN_ID = 'plan_weekly_auto_blr';
  const DRIVER_ID = 'test_driver_engine';

  beforeAll(async () => {
    await prisma.driver.upsert({
      where: { id: DRIVER_ID },
      update: {},
      create: { id: DRIVER_ID, phone: '+919999999991', name: 'Test Driver', vehicleType: 'AUTO', city: 'Bangalore' },
    });
  });

  afterAll(async () => {
    await prisma.subscriptionPriceOverride.deleteMany({ where: { driverId: DRIVER_ID } });
    await prisma.driver.delete({ where: { id: DRIVER_ID } });
  });

  it('returns standard price with no discounts', async () => {
    const result = await calculateSubscriptionPrice(DRIVER_ID, PLAN_ID);
    expect(result.basePrice).toBeGreaterThan(0);
    expect(result.finalPrice).toBeGreaterThan(0);
    expect(['PEAK', 'OFF_PEAK', 'NONE']).toContain(result.discountType);
  });

  it('driver override takes priority over plan price', async () => {
    const admin = await prisma.adminUser.findFirst();
    if (!admin) return;

    await prisma.subscriptionPriceOverride.create({
      data: {
        driverId: DRIVER_ID, planId: PLAN_ID, customPrice: 99,
        reason: 'Test override', validUntil: new Date(Date.now() + 86400000),
        createdById: admin.id,
      },
    });

    const result = await calculateSubscriptionPrice(DRIVER_ID, PLAN_ID);
    expect(result.discountType).toBe('OVERRIDE');
    expect(result.finalPrice).toBe(99);
  });
});
