import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { redis } from '../config/redis.js';
import { UnauthorizedError } from '../utils/AppError.js';
import { catchAsync } from './catchAsync.js';

// ─── Admin auth middleware — reads adminAccessToken cookie ────────────────
// Separate from consumer `protect` middleware intentionally.
// Checks: valid JWT → role must be admin/super_admin → not banned/blacklisted
export const adminProtect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['adminAccessToken'] as string | undefined;

    if (!token) throw new UnauthorizedError('Admin authentication required');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired admin session');
    }

    // Role check in token
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      throw new UnauthorizedError('Admin access required');
    }

    // Check if this token is blacklisted in Redis (covers demotion case)
    const isBlacklisted = await redis.get(`admin_blacklist:${token}`).catch(() => null);
    if (isBlacklisted) throw new UnauthorizedError('Session has been invalidated');

    // Attach decoded payload to request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = decoded;

    next();
  }
);
