import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError.js';

type Role = 'user' | 'admin' | 'moderator' | 'premium';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role as Role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }

    next();
  };
};
