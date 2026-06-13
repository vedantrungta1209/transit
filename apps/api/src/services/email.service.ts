import axios from 'axios';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Transit <noreply@transitco.in>';

export async function sendEmailOtp(to: string, otp: string): Promise<void> {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'FILL_ME') {
    console.log(`[EMAIL] To: ${to} | OTP: ${otp}`);
    return;
  }
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: FROM,
      to: [to],
      subject: 'Your Transit verification code',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0F2B5B;margin-bottom:8px">Transit</h2>
        <p style="color:#444;font-size:15px">Your verification code is:</p>
        <div style="background:#F4F1EA;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0F2B5B">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>`,
    },
    { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
  );
}
