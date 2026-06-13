import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { setOtp, getOtp, deleteOtp, setRefreshToken, getRefreshToken, deleteRefreshToken } from '../utils/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendOtp } from '../services/sms.service';
import { sendEmailOtp } from '../services/email.service';
import { success, error } from '../utils/response';
import { generateOtp, normalizePhone, isValidIndianPhone } from '@transit/shared';

export async function sendUserOtp(req: Request, res: Response) {
  const { phone } = req.body;
  const normalized = normalizePhone(phone);
  if (!isValidIndianPhone(normalized)) return error(res, 'Invalid phone number', 400);

  const otp = generateOtp(6);
  await setOtp(normalized, otp);
  await sendOtp(normalized, otp);
  success(res, { message: 'OTP sent' });
}

export async function verifyUserOtp(req: Request, res: Response) {
  const { phone, otp } = req.body;
  const normalized = normalizePhone(phone);

  const testPhone = process.env.TEST_PHONE;
  const testOtp = process.env.TEST_OTP || '000000';
  const isTestBypass = testPhone && normalized === testPhone && otp === testOtp;

  if (!isTestBypass) {
    const stored = await getOtp(normalized);
    if (!stored || stored !== otp) return error(res, 'Invalid or expired OTP', 400);
    await deleteOtp(normalized);
  }

  let user = await prisma.user.findUnique({ where: { phone: normalized } });
  const isNew = !user;
  if (!user) {
    user = await prisma.user.create({ data: { phone: normalized } });
  }

  const accessToken = signAccessToken({ id: user.id, type: 'user' });
  const refreshToken = signRefreshToken({ id: user.id, type: 'user' });
  await setRefreshToken(refreshToken, user.id, 30 * 86400);

  success(res, { accessToken, refreshToken, user, isNew });
}

export async function sendDriverOtp(req: Request, res: Response) {
  const { phone } = req.body;
  const normalized = normalizePhone(phone);
  if (!isValidIndianPhone(normalized)) return error(res, 'Invalid phone number', 400);
  const otp = generateOtp(6);
  await setOtp(`driver:${normalized}`, otp);
  await sendOtp(normalized, otp);
  success(res, { message: 'OTP sent' });
}

export async function verifyDriverOtp(req: Request, res: Response) {
  const { phone, otp } = req.body;
  const normalized = normalizePhone(phone);
  const stored = await getOtp(`driver:${normalized}`);
  if (!stored || stored !== otp) return error(res, 'Invalid or expired OTP', 400);
  await deleteOtp(`driver:${normalized}`);

  const driver = await prisma.driver.findUnique({ where: { phone: normalized } });
  if (!driver) return success(res, { registered: false, phone: normalized });

  const accessToken = signAccessToken({ id: driver.id, type: 'driver' });
  const refreshToken = signRefreshToken({ id: driver.id, type: 'driver' });
  await setRefreshToken(refreshToken, driver.id, 30 * 86400);

  success(res, { accessToken, refreshToken, driver, registered: true });
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return error(res, 'Invalid credentials', 401);

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return error(res, 'Invalid credentials', 401);

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const accessToken = signAccessToken({ id: admin.id, type: 'admin', role: admin.role });
  const refreshToken = signRefreshToken({ id: admin.id, type: 'admin', role: admin.role });
  await setRefreshToken(refreshToken, admin.id, 30 * 86400);

  success(res, { accessToken, refreshToken, admin: { ...admin, passwordHash: undefined } });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (!token) return error(res, 'Refresh token required', 400);
  try {
    const payload = verifyRefreshToken(token);
    const stored = await getRefreshToken(token);
    if (!stored) return error(res, 'Invalid refresh token', 401);
    const accessToken = signAccessToken({ id: payload.id, type: payload.type, role: payload.role });
    success(res, { accessToken });
  } catch {
    return error(res, 'Invalid refresh token', 401);
  }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (token) await deleteRefreshToken(token);
  success(res, { message: 'Logged out' });
}

export async function sendUserEmailOtp(req: Request, res: Response) {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, 'Invalid email address', 400);
  const otp = generateOtp(6);
  await setOtp(`email:${email.toLowerCase()}`, otp, 600); // 10 min TTL
  await sendEmailOtp(email, otp);
  success(res, { message: 'OTP sent to email' });
}

export async function verifyUserEmailOtp(req: Request, res: Response) {
  const { email, otp } = req.body;
  if (!email || !otp) return error(res, 'Email and OTP required', 400);
  const key = `email:${email.toLowerCase()}`;
  const stored = await getOtp(key);
  if (!stored || stored !== otp) return error(res, 'Invalid or expired OTP', 400);
  await deleteOtp(key);

  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const isNew = !user;
  if (!user) {
    user = await prisma.user.create({ data: { email: email.toLowerCase(), phone: `email_${Date.now()}` } });
  }

  const accessToken = signAccessToken({ id: user.id, type: 'user' });
  const refreshToken = signRefreshToken({ id: user.id, type: 'user' });
  await setRefreshToken(refreshToken, user.id, 30 * 86400);

  success(res, { accessToken, refreshToken, user, isNew });
}
