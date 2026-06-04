import Razorpay from 'razorpay';
import crypto from 'crypto';

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function createOrder(amount: number, receipt: string) {
  return rzp.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

export async function createSubscription(planId: string, totalCount: number, customerId?: string) {
  return rzp.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    customer_notify: 1,
    ...(customerId && { customer_id: customerId }),
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return rzp.subscriptions.cancel(subscriptionId);
}

export async function createContact(name: string, phone: string) {
  const res = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ name, contact: phone, type: 'vendor' }),
  });
  return res.json();
}
