import axios from 'axios';

const EXOTEL_SID = process.env.EXOTEL_SID!;
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY!;
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN!;
const EXOTEL_SENDER = process.env.EXOTEL_SENDER_ID || 'TRNST';
const BASE_URL = `https://api.exotel.com/v1/Accounts/${EXOTEL_SID}`;

async function sendSms(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SMS] To: ${to} | Message: ${body}`);
    return;
  }
  await axios.post(
    `${BASE_URL}/Sms/send`,
    new URLSearchParams({ From: EXOTEL_SENDER, To: to, Body: body }),
    { auth: { username: EXOTEL_API_KEY, password: EXOTEL_API_TOKEN } }
  );
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  await sendSms(phone, `Your Transit OTP is ${otp}. Valid for 10 minutes. Do not share.`);
}

export async function sendRideConfirmation(phone: string, driverName: string, vehicleNumber: string): Promise<void> {
  await sendSms(phone, `Your Transit ride is confirmed. Driver: ${driverName}, Vehicle: ${vehicleNumber}.`);
}

export async function sendSubscriptionReceipt(phone: string, planName: string, amount: number, expiry: Date): Promise<void> {
  const expiryStr = expiry.toLocaleDateString('en-IN');
  await sendSms(phone, `Transit subscription active: ${planName}. Amount paid: Rs ${amount}. Valid till ${expiryStr}.`);
}

export async function sendKycStatus(phone: string, status: 'VERIFIED' | 'REJECTED', note?: string): Promise<void> {
  const msg = status === 'VERIFIED'
    ? 'Your KYC has been approved. You can now go online and accept rides on Transit.'
    : `Your KYC was not approved. Reason: ${note || 'Documents unclear'}. Please re-upload.`;
  await sendSms(phone, msg);
}
