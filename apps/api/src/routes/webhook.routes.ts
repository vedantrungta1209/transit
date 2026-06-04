import { Router } from 'express';
import { razorpayWebhook } from '../controllers/webhook.controller';
const r = Router();
r.post('/razorpay', razorpayWebhook);
export default r;
