import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { error } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      driver?: any;
      admin?: any;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return error(res, 'Authentication required', 401);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'user') return error(res, 'Invalid token type', 401);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) return error(res, 'User not found or inactive', 401);
    req.user = user;
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
}

export async function authenticateDriver(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return error(res, 'Authentication required', 401);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'driver') return error(res, 'Invalid token type', 401);
    const driver = await prisma.driver.findUnique({ where: { id: payload.id } });
    if (!driver || !driver.isActive) return error(res, 'Driver not found or inactive', 401);
    req.driver = driver;
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return error(res, 'Authentication required', 401);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'admin') return error(res, 'Invalid token type', 401);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.id } });
    if (!admin || !admin.isActive) return error(res, 'Admin not found or inactive', 401);
    req.admin = admin;
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
}
