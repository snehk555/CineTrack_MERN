import bcrypt from 'bcryptjs';
import { Response } from 'express';
import User from '../../models/user.model.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { UnauthorizedError, NotFoundError, AppError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  clearAuthCookies,
} from '../../utils/tokenUtils.js';

// ─── Admin-specific cookie names (separate from consumer cookies) ─────────
const ADMIN_ACCESS_COOKIE  = 'adminAccessToken';
const ADMIN_REFRESH_COOKIE = 'adminRefreshToken';

const isProduction = process.env.NODE_ENV === 'production';

const FAILED_ADMIN_PREFIX = 'failed_admin_login:';
const MAX_FAILED = 5;
const LOCK_DURATION = 1 * 60; // 1 minutes

// ─── Set admin-specific httpOnly cookies ─────────────────────────────────
const setAdminCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ADMIN_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,          // 15 min
  });
  res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,     // 1 day (shorter than consumer)
  });
};

// ─── Clear admin cookies ──────────────────────────────────────────────────
export const clearAdminCookies = (res: Response) => {
  res.clearCookie(ADMIN_ACCESS_COOKIE,  { httpOnly: true, secure: isProduction, sameSite: 'strict' });
  res.clearCookie(ADMIN_REFRESH_COOKIE, { httpOnly: true, secure: isProduction, sameSite: 'strict' });
};

// ─── Admin Auth Service ───────────────────────────────────────────────────
export const adminAuthService = {

  async login(email: string, password: string, res: Response) {
    const lockKey = `${FAILED_ADMIN_PREFIX}${email}`;

    // Brute-force check
    const isLocked = await redis.get(lockKey).catch(() => null);
    if (isLocked) {
      throw new AppError(
        'Admin account temporarily locked. Try again in 1 minutes.',
        423,
        'ACCOUNT_LOCKED'
      );
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await redis.incr(lockKey);
      await redis.expire(lockKey, LOCK_DURATION);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Role check — only admin or super_admin allowed
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      logger.warn(`Non-admin login attempt on admin portal: ${email}`);
      throw new UnauthorizedError('Access denied. Admin credentials required.');
    }

    // Banned check
    if (user.isBanned) {
      throw new AppError('This admin account has been disabled.', 403, 'ACCOUNT_BANNED');
    }

    // Password check
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const attempts = await redis.incr(lockKey);
      if (attempts === 1) await redis.expire(lockKey, LOCK_DURATION);
      if (attempts >= MAX_FAILED) {
        throw new AppError('Too many failed attempts. Account locked for 1 minutes.', 423, 'ACCOUNT_LOCKED');
      }
      throw new UnauthorizedError('Invalid credentials');
    }

    // Clear failed attempts
    await redis.del(lockKey);

    const payload = { userId: user._id.toString(), role: user.role, email: user.email };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAdminCookies(res, accessToken, refreshToken);

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => null);

    logger.info(`Admin login: ${user.email} [${user.role}]`);

    // Fire-and-forget audit log
    logAdminAction({
      adminId: user._id.toString(),
      adminName: user.name,
      action: 'ADMIN_LOGIN',
      metadata: { email: user.email, role: user.role },
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        subscriptionPlan: user.subscriptionPlan,
        isActive: user.isActive,
        isBanned: user.isBanned,
      },
      // Note: requiresTwoFA will be true once 2FA is enabled on the account
      requiresTwoFA: user.isTwoFAEnabled ?? false,
    };
  },

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) throw new UnauthorizedError('Refresh token required');

    // Blacklist check
    const isBlacklisted = await redis.get(`admin_blacklist:${refreshToken}`).catch(() => null);
    if (isBlacklisted) throw new UnauthorizedError('Token has been invalidated');

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearAdminCookies(res);
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Role re-check on refresh (handles demotion case)
    const user = await User.findById(decoded.userId).lean();
    if (!user) throw new NotFoundError('User');
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      clearAdminCookies(res);
      throw new UnauthorizedError('Admin access revoked');
    }
    if (user.isBanned) {
      clearAdminCookies(res);
      throw new UnauthorizedError('Admin account disabled');
    }

    // Rotate tokens — blacklist old refresh token
    await redis.setex(`admin_blacklist:${refreshToken}`, 24 * 60 * 60, '1').catch(() => null);

    const payload = { userId: user._id.toString(), role: user.role, email: user.email };
    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    setAdminCookies(res, newAccessToken, newRefreshToken);

    return { accessToken: newAccessToken };
  },

  async logout(refreshToken: string, res: Response) {
    if (refreshToken) {
      await redis.setex(`admin_blacklist:${refreshToken}`, 24 * 60 * 60, '1').catch(() => null);
    }
    clearAdminCookies(res);
    logger.info('Admin logged out');
  },

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-password').lean();
    if (!user) throw new NotFoundError('User');
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new UnauthorizedError('Admin access required');
    }
    return user;
  },
};
