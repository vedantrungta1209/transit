import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { calculateSubscriptionPrice } from '../services/subscription-engine.service';
import { sendKycStatus } from '../services/sms.service';
import { success, error } from '../utils/response';

export async function getDashboardStats(req: Request, res: Response) {
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  const [todayRides, activeDrivers, pendingKYC, activeSubscriptions, revenueToday, cancelledRides, totalRidesToday] = await Promise.all([
    prisma.ride.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.driver.count({ where: { isOnline: true } }),
    prisma.driver.count({ where: { kycStatus: 'PENDING' } }),
    prisma.driverSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.ride.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: todayStart } }, _sum: { actualFare: true } }),
    prisma.ride.count({ where: { status: 'CANCELLED', createdAt: { gte: todayStart } } }),
    prisma.ride.count({ where: { createdAt: { gte: todayStart }, status: { in: ['COMPLETED', 'CANCELLED'] } } }),
  ]);

  success(res, {
    todayRides,
    activeDrivers,
    pendingKYC,
    activeSubscriptions,
    revenueToday: Number(revenueToday._sum.actualFare || 0),
    cancelRate: totalRidesToday > 0 ? ((cancelledRides / totalRidesToday) * 100).toFixed(1) : '0',
  });
}

export async function listPlans(req: Request, res: Response) {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { subscriptions: true } } },
  });
  success(res, plans);
}

export async function createPlan(req: Request, res: Response) {
  const data = req.body;
  const plan = await prisma.subscriptionPlan.create({
    data: { ...data, createdById: req.admin.id },
  });
  success(res, plan, 201);
}

export async function updatePlan(req: Request, res: Response) {
  const { id } = req.params;
  const { basePrice, ...rest } = req.body;

  if (basePrice !== undefined) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (plan) {
      await prisma.subscriptionPriceAudit.create({
        data: {
          planId: id,
          oldPrice: plan.basePrice,
          newPrice: basePrice,
          changedById: req.admin.id,
          changeType: 'MANUAL',
          reason: rest.auditReason || 'Manual update by admin',
        },
      });
    }
  }

  const updated = await prisma.subscriptionPlan.update({ where: { id }, data: { ...rest, basePrice } });
  success(res, updated);
}

export async function schedulePriceChange(req: Request, res: Response) {
  const { id } = req.params;
  const { newPrice, effectiveFrom } = req.body;

  const schedule = await prisma.subscriptionPriceSchedule.create({
    data: { planId: id, newPrice, effectiveFrom: new Date(effectiveFrom), createdById: req.admin.id },
  });
  success(res, schedule, 201);
}

export async function cancelScheduledChange(req: Request, res: Response) {
  const { scheduleId } = req.params;
  const schedule = await prisma.subscriptionPriceSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.appliedAt) return error(res, 'Schedule not found or already applied', 404);
  await prisma.subscriptionPriceSchedule.delete({ where: { id: scheduleId } });
  success(res, { message: 'Schedule cancelled' });
}

export async function createPriceOverride(req: Request, res: Response) {
  const { driverId, planId, customPrice, reason, validUntil, adminNote } = req.body;
  const override = await prisma.subscriptionPriceOverride.create({
    data: { driverId, planId, customPrice, reason, adminNote, validUntil: new Date(validUntil), createdById: req.admin.id },
  });
  success(res, override, 201);
}

export async function listDrivers(req: Request, res: Response) {
  const { page = 1, limit = 20, city, status, kycStatus, search } = req.query as any;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (city) where.city = city;
  if (kycStatus) where.kycStatus = kycStatus;
  if (status === 'online') where.isOnline = true;
  if (status === 'offline') where.isOnline = false;
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }];

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.driver.count({ where }),
  ]);
  success(res, { data: drivers, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
}

export async function getDriver(req: Request, res: Response) {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      earnings: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });
  if (!driver) return error(res, 'Driver not found', 404);
  success(res, driver);
}

export async function updateDriverKyc(req: Request, res: Response) {
  const { id } = req.params;
  const { status, note } = req.body;
  const driver = await prisma.driver.update({ where: { id }, data: { kycStatus: status } });
  await sendKycStatus(driver.phone, status, note);
  success(res, driver);
}

export async function suspendDriver(req: Request, res: Response) {
  const { id } = req.params;
  const driver = await prisma.driver.update({ where: { id }, data: { isActive: false, isOnline: false } });
  success(res, driver);
}

export async function listFareRules(req: Request, res: Response) {
  const rules = await prisma.farePricingRule.findMany({ orderBy: [{ city: 'asc' }, { vehicleType: 'asc' }] });
  success(res, rules);
}

export async function createFareRule(req: Request, res: Response) {
  const rule = await prisma.farePricingRule.create({ data: req.body });
  success(res, rule, 201);
}

export async function updateFareRule(req: Request, res: Response) {
  const rule = await prisma.farePricingRule.update({ where: { id: req.params.id }, data: req.body });
  success(res, rule);
}

export async function updateSurge(req: Request, res: Response) {
  const { surgeMultiplier, revertAfterHours } = req.body;
  const rule = await prisma.farePricingRule.update({
    where: { id: req.params.id },
    data: {
      surgeMultiplier,
      surgeRevertAt: revertAfterHours ? new Date(Date.now() + revertAfterHours * 3600000) : null,
    },
  });
  success(res, rule);
}

export async function listRides(req: Request, res: Response) {
  const { page = 1, limit = 20, status, city, from, to } = req.query as any;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (from || to) where.createdAt = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, phone: true } }, driver: { select: { name: true, phone: true } } } }),
    prisma.ride.count({ where }),
  ]);
  success(res, { data: rides, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
}

export async function getAnalytics(req: Request, res: Response) {
  const { period = 'monthly' } = req.query;
  const days = period === 'daily' ? 7 : period === 'weekly' ? 28 : 90;
  const since = new Date(Date.now() - days * 86400000);

  const [rides, revenue, subscriptionRevenue] = await Promise.all([
    prisma.ride.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: since }, status: 'COMPLETED' },
      _count: true,
      _sum: { actualFare: true },
    }),
    prisma.ride.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: since } }, _sum: { actualFare: true } }),
    prisma.driverSubscription.aggregate({ where: { createdAt: { gte: since }, status: { not: 'PAYMENT_FAILED' } }, _sum: { amountPaid: true } }),
  ]);

  success(res, {
    totalRevenue: Number(revenue._sum.actualFare || 0),
    subscriptionRevenue: Number(subscriptionRevenue._sum.amountPaid || 0),
    rideData: rides,
  });
}
