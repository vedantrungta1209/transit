import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { getDistanceMatrix } from '../services/maps.service';
import { sendToDevice } from '../services/fcm.service';
import { createOrder } from '../services/razorpay.service';
import { success, error } from '../utils/response';
import { haversineDistance, generateOtp } from '@transit/shared';
import { getIo } from '../utils/io';
import crypto from 'crypto';

async function getFareRule(city: string, vehicleType: string) {
  return prisma.farePricingRule.findUnique({
    where: { city_vehicleType: { city, vehicleType: vehicleType as any } },
  });
}

export async function estimateFare(req: Request, res: Response) {
  const { pickupLat, pickupLng, dropLat, dropLng, vehicleType, city = 'Bangalore' } = req.body;
  try {
    const [rule, distResult] = await Promise.all([
      getFareRule(city, vehicleType),
      getDistanceMatrix(pickupLat, pickupLng, dropLat, dropLng),
    ]);
    if (!rule) return error(res, 'No fare rule found for this city/vehicle type', 404);

    const { distanceKm, durationMin } = distResult;
    const surge = Number(rule.surgeMultiplier);
    const baseFare = Number(rule.baseFare);
    const distanceFare = distanceKm * Number(rule.perKmRate);
    const timeFare = durationMin * Number(rule.perMinRate);
    const raw = (baseFare + distanceFare + timeFare) * surge;
    const estimatedFare = Math.max(Number(rule.minimumFare), Math.round(raw));

    success(res, {
      estimatedFare,
      distance: distanceKm,
      duration: durationMin,
      surgeMultiplier: surge,
      breakdown: { baseFare, distanceFare: Math.round(distanceFare), timeFare: Math.round(timeFare), surgeFare: Math.round(raw - (baseFare + distanceFare + timeFare)) },
    });
  } catch (err) {
    error(res, 'Fare estimation failed', 500, err);
  }
}

export async function createRide(req: Request, res: Response) {
  const { pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, vehicleType, paymentMethod } = req.body;
  const userId = req.user.id;
  const city = req.user.city || 'Bangalore';

  try {
    const [rule, distResult] = await Promise.all([
      getFareRule(city, vehicleType),
      getDistanceMatrix(pickupLat, pickupLng, dropLat, dropLng),
    ]);
    if (!rule) return error(res, 'Service not available in this area', 404);

    const { distanceKm, durationMin } = distResult;
    const surge = Number(rule.surgeMultiplier);
    const estimatedFare = Math.max(
      Number(rule.minimumFare),
      Math.round((Number(rule.baseFare) + distanceKm * Number(rule.perKmRate) + durationMin * Number(rule.perMinRate)) * surge)
    );

    const otp = generateOtp(4);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const ride = await prisma.ride.create({
      data: {
        userId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress,
        vehicleType, estimatedFare, paymentMethod, otp: otpHash,
      },
    });

    // Start driver matching asynchronously
    matchDriver(ride.id, pickupLat, pickupLng, vehicleType, city);

    success(res, { ride: { ...ride, otp }, estimatedFare }, 201);
  } catch (err) {
    error(res, 'Failed to create ride', 500, err);
  }
}

async function matchDriver(rideId: string, lat: number, lng: number, vehicleType: string, city: string, attempt = 0) {
  const RADIUS = attempt < 3 ? 5 : 8;
  const drivers = await prisma.driver.findMany({
    where: { vehicleType: vehicleType as any, isOnline: true, isAvailable: true, city, kycStatus: 'VERIFIED' },
  });

  const nearby = drivers
    .filter(d => d.currentLat && d.currentLng && haversineDistance(lat, lng, d.currentLat!, d.currentLng!) <= RADIUS)
    .sort((a, b) =>
      haversineDistance(lat, lng, a.currentLat!, a.currentLng!) -
      haversineDistance(lat, lng, b.currentLat!, b.currentLng!)
    );

  if (!nearby.length || attempt >= 4) {
    getIo().to(`user:${(await prisma.ride.findUnique({ where: { id: rideId } }))?.userId}`).emit('no_drivers_found', { rideId });
    await prisma.ride.update({ where: { id: rideId }, data: { status: 'CANCELLED', cancellationReason: 'No drivers available' } });
    return;
  }

  const driver = nearby[attempt % nearby.length];
  const distToPickup = haversineDistance(lat, lng, driver.currentLat!, driver.currentLng!);

  getIo().to(`driver:${driver.id}`).emit('ride_request', {
    rideId,
    pickupLat: lat, pickupLng: lng,
    distanceToPickup: distToPickup.toFixed(1),
    vehicleType,
    timeoutSeconds: 15,
  });

  // Auto-reject after 15s
  setTimeout(async () => {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (ride?.status === 'SEARCHING') {
      await matchDriver(rideId, lat, lng, vehicleType, city, attempt + 1);
    }
  }, 15000);
}

export async function acceptRide(req: Request, res: Response) {
  const { id } = req.params;
  const driverId = req.driver.id;

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride || ride.status !== 'SEARCHING') return error(res, 'Ride not available', 400);

  const updated = await prisma.ride.update({
    where: { id },
    data: { driverId, status: 'DRIVER_ASSIGNED' },
    include: { driver: true },
  });
  await prisma.driver.update({ where: { id: driverId }, data: { isAvailable: false } });

  getIo().to(`user:${ride.userId}`).emit('driver_assigned', {
    rideId: id,
    driver: { id: updated.driver!.id, name: updated.driver!.name, phone: updated.driver!.phone, vehicleNumber: updated.driver!.vehicleNumber, vehicleModel: updated.driver!.vehicleModel },
  });

  success(res, updated);
}

export async function arriveAtPickup(req: Request, res: Response) {
  const { id } = req.params;
  const ride = await prisma.ride.update({ where: { id }, data: { status: 'DRIVER_ARRIVING' } });
  getIo().to(`user:${ride.userId}`).emit('ride_status_update', { rideId: id, status: 'DRIVER_ARRIVING' });
  success(res, ride);
}

export async function startRide(req: Request, res: Response) {
  const { id } = req.params;
  const { otp } = req.body;
  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return error(res, 'Ride not found', 404);

  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (ride.otp !== otpHash) return error(res, 'Invalid OTP', 400);

  const updated = await prisma.ride.update({ where: { id }, data: { status: 'IN_PROGRESS', otpVerified: true } });
  getIo().to(`user:${ride.userId}`).emit('ride_status_update', { rideId: id, status: 'IN_PROGRESS' });
  success(res, updated);
}

export async function completeRide(req: Request, res: Response) {
  const { id } = req.params;
  const ride = await prisma.ride.findUnique({ where: { id }, include: { driver: true } });
  if (!ride || !ride.driverId) return error(res, 'Ride not found', 404);

  const city = ride.driver?.city || 'Bangalore';
  const [rule, distResult] = await Promise.all([
    getFareRule(city, ride.vehicleType),
    getDistanceMatrix(ride.pickupLat, ride.pickupLng, ride.dropLat, ride.dropLng),
  ]);

  const { distanceKm, durationMin } = distResult || { distanceKm: 1, durationMin: 5 };
  const surge = rule ? Number(rule.surgeMultiplier) : 1;
  const actualFare = rule
    ? Math.max(Number(rule.minimumFare), Math.round((Number(rule.baseFare) + distanceKm * Number(rule.perKmRate) + durationMin * Number(rule.perMinRate)) * surge))
    : Number(ride.estimatedFare);

  let paymentStatus: 'PAID' | 'PENDING' = 'PENDING';
  let razorpayOrderId: string | undefined;

  if (ride.paymentMethod === 'CASH') {
    paymentStatus = 'PAID';
  } else if (ride.paymentMethod === 'UPI') {
    const order = await createOrder(actualFare, `ride_${id}`);
    razorpayOrderId = order.id;
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: { status: 'COMPLETED', actualFare, distance: distanceKm, duration: durationMin, paymentStatus, razorpayOrderId },
  });

  await prisma.driver.update({ where: { id: ride.driverId }, data: { isAvailable: true, totalEarnings: { increment: actualFare } } });
  await prisma.driverEarning.create({ data: { driverId: ride.driverId, rideId: id, amount: actualFare, type: 'RIDE' } });

  getIo().to(`user:${ride.userId}`).emit('ride_completed', { rideId: id, actualFare, razorpayOrderId });
  success(res, updated);
}

export async function cancelRide(req: Request, res: Response) {
  const { id } = req.params;
  const { cancelledBy, reason } = req.body;

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return error(res, 'Ride not found', 404);

  const updated = await prisma.ride.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledBy, cancellationReason: reason },
  });

  if (ride.driverId) {
    await prisma.driver.update({ where: { id: ride.driverId }, data: { isAvailable: true } });
    getIo().to(`driver:${ride.driverId}`).emit('ride_status_update', { rideId: id, status: 'CANCELLED' });
  }
  getIo().to(`user:${ride.userId}`).emit('ride_status_update', { rideId: id, status: 'CANCELLED' });

  success(res, updated);
}

export async function getRide(req: Request, res: Response) {
  const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: { driver: true, user: true } });
  if (!ride) return error(res, 'Ride not found', 404);
  success(res, ride);
}

export async function getRideHistory(req: Request, res: Response) {
  const { page = 1, limit = 20 } = req.query as any;
  const skip = (Number(page) - 1) * Number(limit);
  const where = req.user ? { userId: req.user.id } : { driverId: req.driver.id };
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
    prisma.ride.count({ where }),
  ]);
  success(res, { data: rides, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
}
