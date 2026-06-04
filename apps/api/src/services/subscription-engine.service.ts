import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { isWithinPeakHours } from '@transit/shared';
import { sendToDevice } from './fcm.service';
import type { SubscriptionPriceResult } from '@transit/shared';

export async function calculateSubscriptionPrice(
  driverId: string,
  planId: string
): Promise<SubscriptionPriceResult> {
  // 1. Check for active driver-specific override
  const override = await prisma.subscriptionPriceOverride.findFirst({
    where: { driverId, planId, validUntil: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (override) {
    return {
      basePrice: Number(override.customPrice),
      discount: 0,
      discountType: 'OVERRIDE',
      finalPrice: Number(override.customPrice),
      reason: `Custom price applied: ${override.reason}`,
    };
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  const basePrice = Number(plan.basePrice);

  // 2. Check active campaign
  const now = new Date();
  const campaign = await prisma.subscriptionCampaign.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      targetCities: { has: plan.city },
      ...(plan.vehicleType && { targetVehicleTypes: { has: plan.vehicleType } }),
    },
  });

  if (campaign) {
    const discount = basePrice * (Number(campaign.discountPercent) / 100);
    return {
      basePrice,
      discount,
      discountType: 'CAMPAIGN',
      finalPrice: Math.round(basePrice - discount),
      reason: `Campaign: ${campaign.name}`,
    };
  }

  // 3. Peak / off-peak
  const isPeak = isWithinPeakHours(plan.peakHoursStart, plan.peakHoursEnd);
  if (isPeak && Number(plan.peakHoursDiscount) > 0) {
    const discount = basePrice * Number(plan.peakHoursDiscount);
    return {
      basePrice,
      discount,
      discountType: 'PEAK',
      finalPrice: Math.round(basePrice - discount),
      reason: `Peak hours discount (${plan.peakHoursStart}–${plan.peakHoursEnd})`,
    };
  }

  if (!isPeak && Number(plan.offPeakDiscount) > 0) {
    const discount = basePrice * Number(plan.offPeakDiscount);
    return {
      basePrice,
      discount,
      discountType: 'OFF_PEAK',
      finalPrice: Math.round(basePrice - discount),
      reason: 'Off-peak hours discount',
    };
  }

  return { basePrice, discount: 0, discountType: 'NONE', finalPrice: basePrice, reason: 'Standard price' };
}

export function startSubscriptionCron() {
  // Apply scheduled price changes every minute with distributed lock via Redis SET NX
  cron.schedule('* * * * *', async () => {
    const { redis } = await import('../utils/redis');
    const lockKey = 'cron:price-schedule:lock';
    const locked = await redis.set(lockKey, '1', 'EX', 55, 'NX');
    if (!locked) return;

    try {
      const pending = await prisma.subscriptionPriceSchedule.findMany({
        where: { effectiveFrom: { lte: new Date() }, appliedAt: null },
        include: { plan: true },
      });

      for (const schedule of pending) {
        await prisma.$transaction(async (tx) => {
          await tx.subscriptionPriceAudit.create({
            data: {
              planId: schedule.planId,
              oldPrice: schedule.plan.basePrice,
              newPrice: schedule.newPrice,
              changedById: schedule.createdById,
              changeType: 'SCHEDULED',
              reason: `Scheduled change from ${schedule.plan.basePrice} to ${schedule.newPrice}`,
            },
          });
          await tx.subscriptionPlan.update({
            where: { id: schedule.planId },
            data: { basePrice: schedule.newPrice },
          });
          await tx.subscriptionPriceSchedule.update({
            where: { id: schedule.id },
            data: { appliedAt: new Date() },
          });
        });

        // Notify affected drivers
        const activeSubscriptions = await prisma.driverSubscription.findMany({
          where: { planId: schedule.planId, status: 'ACTIVE' },
          include: { driver: true },
        });

        const expiry = activeSubscriptions[0]?.endDate;
        for (const sub of activeSubscriptions) {
          if (sub.driver.fcmToken) {
            await sendToDevice(
              sub.driver.fcmToken,
              'Subscription Price Updated',
              `Your Transit subscription price is now Rs ${schedule.newPrice}. Current plan protected till ${expiry?.toLocaleDateString('en-IN')}.`,
              { type: 'SUBSCRIPTION_PRICE_CHANGE', planId: schedule.planId }
            );
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Price schedule error:', err);
    }
  });

  // Check expiring subscriptions daily at 9am
  cron.schedule('0 9 * * *', async () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiring = await prisma.driverSubscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: threeDaysFromNow, gt: new Date() } },
      include: { driver: true, plan: true },
    });

    for (const sub of expiring) {
      if (sub.driver.fcmToken) {
        const daysLeft = Math.ceil((sub.endDate.getTime() - Date.now()) / 86400000);
        await sendToDevice(
          sub.driver.fcmToken,
          'Subscription Expiring Soon',
          `Your ${sub.plan.name} subscription expires in ${daysLeft} day(s). Renew now to keep earning.`,
          { type: 'SUBSCRIPTION_EXPIRING', subscriptionId: sub.id }
        );
      }
    }
  });
}
