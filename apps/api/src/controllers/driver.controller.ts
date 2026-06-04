import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { setDriverLocation } from '../utils/redis';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { setRefreshToken } from '../utils/redis';
import { calculateSubscriptionPrice } from '../services/subscription-engine.service';
import { createOrder } from '../services/razorpay.service';
import { sendSubscriptionReceipt, sendKycStatus } from '../services/sms.service';
import { success, error } from '../utils/response';
import { normalizePhone, maskAadhaar, generateOtp } from '@transit/shared';

const upload = multer({ dest: '/tmp/transit-kyc/', limits: { fileSize: 5 * 1024 * 1024 } });
export const kycUpload = upload.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'licence', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

export async function registerDriver(req: Request, res: Response) {
  const { phone, name, aadhaarNumber, licenceNumber, licenceExpiry, vehicleType, vehicleNumber, vehicleModel, vehicleYear, city, email } = req.body;
  const normalized = normalizePhone(phone);

  const existing = await prisma.driver.findUnique({ where: { phone: normalized } });
  if (existing) return error(res, 'Driver already registered', 409);

  if (aadhaarNumber && aadhaarNumber.replace(/\D/g, '').length !== 12) {
    return error(res, 'Invalid Aadhaar number', 400);
  }
  const aadhaarLast4 = aadhaarNumber ? aadhaarNumber.replace(/\D/g, '').slice(-4) : undefined;

  const driver = await prisma.driver.create({
    data: {
      phone: normalized, name, email, licenceNumber,
      licenceExpiry: licenceExpiry ? new Date(licenceExpiry) : undefined,
      vehicleType, vehicleNumber, vehicleModel, vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
      city, aadhaarLast4,
    },
  });

  const accessToken = signAccessToken({ id: driver.id, type: 'driver' });
  const refreshToken = signRefreshToken({ id: driver.id, type: 'driver' });
  await setRefreshToken(refreshToken, driver.id, 30 * 86400);

  success(res, { driver, accessToken, refreshToken }, 201);
}

export async function getMyProfile(req: Request, res: Response) {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver.id },
    select: { id: true, phone: true, name: true, email: true, profilePhoto: true, aadhaarLast4: true, licenceNumber: true, licenceExpiry: true, vehicleType: true, vehicleNumber: true, vehicleModel: true, vehicleYear: true, isOnline: true, isAvailable: true, walletBalance: true, totalEarnings: true, kycStatus: true, city: true, createdAt: true },
  });
  success(res, driver);
}

export async function updateProfile(req: Request, res: Response) {
  const { name, email, vehicleNumber, vehicleModel, fcmToken } = req.body;
  const driver = await prisma.driver.update({
    where: { id: req.driver.id },
    data: { name, email, vehicleNumber, vehicleModel, fcmToken },
  });
  success(res, driver);
}

export async function updateLocation(req: Request, res: Response) {
  const { lat, lng, heading } = req.body;
  await setDriverLocation(req.driver.id, lat, lng, heading);
  // Persist to DB every 30s — client should call this endpoint accordingly
  await prisma.driver.update({
    where: { id: req.driver.id },
    data: { currentLat: lat, currentLng: lng, heading, isOnline: true },
  });
  success(res, { updated: true });
}

export async function setOnlineStatus(req: Request, res: Response) {
  const { isOnline } = req.body;
  const driver = await prisma.driver.update({
    where: { id: req.driver.id },
    data: { isOnline, isAvailable: isOnline },
  });
  success(res, { isOnline: driver.isOnline });
}

export async function getEarnings(req: Request, res: Response) {
  const driverId = req.driver.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, week, month, total, recentRides] = await Promise.all([
    prisma.driverEarning.aggregate({ where: { driverId, createdAt: { gte: todayStart } }, _sum: { amount: true } }),
    prisma.driverEarning.aggregate({ where: { driverId, createdAt: { gte: weekStart } }, _sum: { amount: true } }),
    prisma.driverEarning.aggregate({ where: { driverId, createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.driverEarning.aggregate({ where: { driverId }, _sum: { amount: true } }),
    prisma.ride.findMany({ where: { driverId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  success(res, {
    today: Number(today._sum.amount || 0),
    thisWeek: Number(week._sum.amount || 0),
    thisMonth: Number(month._sum.amount || 0),
    total: Number(total._sum.amount || 0),
    rides: recentRides,
  });
}

export async function getSubscription(req: Request, res: Response) {
  const sub = await prisma.driverSubscription.findFirst({
    where: { driverId: req.driver.id, status: 'ACTIVE' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, city: req.driver.city },
  });
  success(res, { currentSubscription: sub, availablePlans: plans });
}

export async function subscribe(req: Request, res: Response) {
  const { planId } = req.body;
  const driverId = req.driver.id;

  const existing = await prisma.driverSubscription.findFirst({
    where: { driverId, status: 'ACTIVE' },
  });
  if (existing) return error(res, 'Active subscription already exists', 409);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return error(res, 'Plan not found or inactive', 404);

  const priceResult = await calculateSubscriptionPrice(driverId, planId);
  const order = await createOrder(priceResult.finalPrice, `sub_${driverId}_${planId}`);

  success(res, {
    razorpayOrderId: order.id,
    amount: priceResult.finalPrice,
    priceBreakdown: priceResult,
    plan,
  });
}

export async function confirmSubscription(req: Request, res: Response) {
  const { planId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const { verifyPaymentSignature } = await import('../services/razorpay.service');

  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return error(res, 'Payment verification failed', 400);
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return error(res, 'Plan not found', 404);

  const startDate = new Date();
  const endDate = new Date();
  if (plan.billingCycle === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
  else endDate.setMonth(endDate.getMonth() + 1);

  const priceResult = await calculateSubscriptionPrice(req.driver.id, planId);
  const sub = await prisma.driverSubscription.create({
    data: {
      driverId: req.driver.id, planId, startDate, endDate,
      amountPaid: priceResult.finalPrice, status: 'ACTIVE',
    },
  });

  await sendSubscriptionReceipt(req.driver.phone, plan.name, priceResult.finalPrice, endDate);
  success(res, sub, 201);
}

export async function uploadKycDocuments(req: Request, res: Response) {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const driverId = req.driver.id;

  const updates: Record<string, string> = {};
  if (files?.aadhaarFront?.[0]) updates.aadhaarDocUrl = files.aadhaarFront[0].path;
  if (files?.licence?.[0]) updates.licenceDocUrl = files.licence[0].path;
  if (files?.selfie?.[0]) updates.selfieUrl = files.selfie[0].path;

  await prisma.driver.update({ where: { id: driverId }, data: { ...updates, kycStatus: 'PENDING' } });
  success(res, { message: 'KYC documents uploaded. Under review.' });
}
