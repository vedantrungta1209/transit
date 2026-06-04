import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, error } from '../utils/response';

export async function getProfile(req: Request, res: Response) {
  success(res, req.user);
}

export async function updateProfile(req: Request, res: Response) {
  const { name, email, fcmToken } = req.body;
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, email, fcmToken } });
  success(res, user);
}

export async function getSavedAddresses(req: Request, res: Response) {
  const addresses = await prisma.savedAddress.findMany({ where: { userId: req.user.id } });
  success(res, addresses);
}

export async function saveAddress(req: Request, res: Response) {
  const { label, address, lat, lng } = req.body;
  const saved = await prisma.savedAddress.create({ data: { userId: req.user.id, label, address, lat, lng } });
  success(res, saved, 201);
}

export async function deleteAddress(req: Request, res: Response) {
  await prisma.savedAddress.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  success(res, { deleted: true });
}

export async function getWallet(req: Request, res: Response) {
  const [user, txns] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id }, select: { walletBalance: true } }),
    prisma.walletTransaction.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  success(res, { balance: Number(user?.walletBalance || 0), transactions: txns });
}

export async function topUpWallet(req: Request, res: Response) {
  const { amount } = req.body;
  const { createOrder } = await import('../services/razorpay.service');
  const order = await createOrder(amount, `wallet_${req.user.id}`);
  success(res, { razorpayOrderId: order.id, amount });
}

export async function rateDriver(req: Request, res: Response) {
  const { rideId, score, comment } = req.body;
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.userId !== req.user.id) return error(res, 'Ride not found', 404);
  if (!ride.driverId) return error(res, 'No driver on this ride', 400);

  const rating = await prisma.rating.create({
    data: { rideId, fromUserId: req.user.id, toDriverId: ride.driverId, score, comment },
  });
  success(res, rating, 201);
}
