import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { UnauthorizedError } from '../utils/AppError.js';
import { catchAsync } from './catchAsync.js';
import User from '../models/user.model.js';

interface AccessTokenPayload {
  userId: string;
  role: 'user' | 'admin' | 'moderator' | 'premium';
  email: string;
  username: string;
}

export const protect = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new UnauthorizedError('Token has been invalidated. Please log in again.');
  }

  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

  const user = await User.findById(decoded.userId).select('-password').lean();
  if (!user) {
    throw new UnauthorizedError('User no longer exists');
  }

  req.user = {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    role: user.role as 'user' | 'admin' | 'moderator' | 'premium',
    username: user.name,
  };

  next();
});

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.accessToken ?? req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    const user = await User.findById(decoded.userId).select('-password').lean();

    if (user) {
      req.user = {
        id: (user._id as { toString(): string }).toString(),
        email: user.email,
        role: user.role as 'user' | 'admin' | 'moderator' | 'premium',
        username: user.name,
      };
    }
  } catch {
    // Silent fail — optional auth does not block the request
  }
  next();
};