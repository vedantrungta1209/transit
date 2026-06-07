import axios from 'axios';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY!;

async function sendSms(to: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !FAST2SMS_API_KEY || FAST2SMS_API_KEY === 'FILL_ME') {
    console.log(`[SMS] To: ${to} | OTP: ${otp}`);
    return;
  }
  try {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'otp', variables_values: otp, numbers: to, flash: 0 },
      { headers: { authorization: FAST2SMS_API_KEY } }
    );
  } catch (err) {
    console.error('[SMS] Fast2SMS send failed:', (err as Error).message);
  }
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  await sendSms(phone, otp);
}

export async function sendRideConfirmation(phone: string, driverName: string, vehicleNumber: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SMS] Ride confirmed to ${phone}: Driver ${driverName}, Vehicle ${vehicleNumber}`);
    return;
  }
  try {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message: `Your Transit ride is confirmed. Driver: ${driverName}, Vehicle: ${vehicleNumber}.`, numbers: phone, flash: 0 },
      { headers: { authorization: FAST2SMS_API_KEY } }
    );
  } catch (err) {
    console.error('[SMS] Fast2SMS send failed:', (err as Error).message);
  }
}

export async function sendSubscriptionReceipt(phone: string, planName: string, amount: number, expiry: Date): Promise<void> {
  const expiryStr = expiry.toLocaleDateString('en-IN');
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SMS] Subscription to ${phone}: ${planName}, Rs ${amount}, till ${expiryStr}`);
    return;
  }
  try {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message: `Transit subscription active: ${planName}. Amount paid: Rs ${amount}. Valid till ${expiryStr}.`, numbers: phone, flash: 0 },
      { headers: { authorization: FAST2SMS_API_KEY } }
    );
  } catch (err) {
    console.error('[SMS] Fast2SMS send failed:', (err as Error).message);
  }
}

export async function sendKycStatus(phone: string, status: 'VERIFIED' | 'REJECTED', note?: string): Promise<void> {
  const msg = status === 'VERIFIED'
    ? 'Your KYC has been approved. You can now go online and accept rides on Transit.'
    : `Your KYC was not approved. Reason: ${note || 'Documents unclear'}. Please re-upload.`;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SMS] KYC status to ${phone}: ${msg}`);
    return;
  }
  try {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message: msg, numbers: phone, flash: 0 },
      { headers: { authorization: FAST2SMS_API_KEY } }
    );
  } catch (err) {
    console.error('[SMS] Fast2SMS send failed:', (err as Error).message);
  }
}
