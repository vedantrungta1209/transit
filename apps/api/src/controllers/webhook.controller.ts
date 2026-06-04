import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { verifyWebhookSignature } from '../services/razorpay.service';
import { success, error } from '../utils/response';
import { io } from '../server';

export async function razorpayWebhook(req: Request, res: Response) {
  const sig = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.body.toString();

  if (!verifyWebhookSignature(rawBody, sig)) {
    return error(res, 'Invalid signature', 401);
  }

  const event = JSON.parse(rawBody);
  const { event: eventType, payload } = event;

  try {
    if (eventType === 'payment.captured') {
      const { order_id, id: paymentId } = payload.payment.entity;
      const receipt = payload.payment.entity.notes?.receipt as string;

      if (receipt?.startsWith('ride_')) {
        const rideId = receipt.replace('ride_', '');
        const ride = await prisma.ride.update({
          where: { id: rideId },
          data: { paymentStatus: 'PAID', razorpayPaymentId: paymentId },
        });
        io.to(`user:${ride.userId}`).emit('payment_confirmed', { rideId });
      } else if (receipt?.startsWith('wallet_')) {
        const userId = receipt.replace('wallet_', '');
        const amount = payload.payment.entity.amount / 100;
        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { walletBalance: { increment: amount } } }),
          prisma.walletTransaction.create({ data: { userId, amount, type: 'TOP_UP', razorpayPaymentId: paymentId } }),
        ]);
      } else if (receipt?.startsWith('sub_')) {
        const [, driverId, planId] = receipt.split('_');
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          if (plan.billingCycle === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
          else endDate.setMonth(endDate.getMonth() + 1);
          const amount = payload.payment.entity.amount / 100;

          await prisma.driverSubscription.create({
            data: { driverId, planId, startDate, endDate, amountPaid: amount, status: 'ACTIVE', razorpaySubscriptionId: paymentId },
          });
        }
      }
    }

    if (eventType === 'subscription.halted') {
      const subId = payload.subscription.entity.id;
      await prisma.driverSubscription.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { status: 'PAYMENT_FAILED' },
      });
    }

    success(res, { received: true });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(200).json({ received: true });
  }
}
