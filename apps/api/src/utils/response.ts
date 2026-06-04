import { Response } from 'express';

export function success<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function error(res: Response, message: string, statusCode = 400, err?: unknown) {
  const details = process.env.NODE_ENV !== 'production' && err instanceof Error ? err.message : undefined;
  return res.status(statusCode).json({ success: false, error: message, details });
}
