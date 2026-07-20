import bcrypt from 'bcryptjs';
import { Response } from 'express';
import User from '../../models/user.model.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../../utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../../utils/tokenUtils.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { addWelcomeEmailJob } from '../../queues/emailQueue.js';

const FAILED_LOGIN_PREFIX = 'failed_login:';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 30 * 60;

export const authService = {
  async register(data: RegisterInput, res: Response) {
    const existingUser = await User.findOne({ email: data.email }).lean();
    if (existingUser) throw new ConflictError('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: 'user',
    });

    const payload = { userId: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    addWelcomeEmailJob({ name: user.name, email: user.email, userId: user._id.toString() }).catch(() => null);

    logger.info(`New user registered: ${user.email}`);

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    };
  },

  async login(data: LoginInput, res: Response) {
    const lockKey = `${FAILED_LOGIN_PREFIX}${data.email}`;

    const isLocked = await redis.get(lockKey).catch(() => null);
    if (isLocked) {
      throw new AppError('Account temporarily locked due to too many failed attempts. Try again in 30 minutes.', 423, 'ACCOUNT_LOCKED');
    }

    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      const attempts = await redis.incr(lockKey);
      if (attempts === 1) {
        await redis.expire(lockKey, LOCK_DURATION_SECONDS);
      }
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        throw new AppError('Account temporarily locked due to too many failed attempts. Try again in 30 minutes.', 423, 'ACCOUNT_LOCKED');
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    await redis.del(lockKey);

    const payload = { userId: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    };
  },

  async logout(refreshToken: string, res: Response) {
    if (refreshToken) {
      await redis.setex(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, '1').catch(() => null);
    }
    clearAuthCookies(res);
    logger.info('User logged out');
  },

  async refreshTokens(refreshToken: string, res: Response) {
    if (!refreshToken) throw new UnauthorizedError('Refresh token required');

    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`).catch(() => null);
    if (isBlacklisted) throw new UnauthorizedError('Token has been invalidated');

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      clearAuthCookies(res);
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) throw new NotFoundError('User');

    const payload = { userId: user._id.toString(), role: user.role, email: user.email };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await redis.setex(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, '1').catch(() => null);
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return { accessToken: newAccessToken };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-password').lean();
    if (!user) throw new NotFoundError('User');
    return user;
  },
};
