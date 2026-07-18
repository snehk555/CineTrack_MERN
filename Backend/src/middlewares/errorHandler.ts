import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  const mongoErr = err as MongoServerError;
  if (mongoErr.code === 11000) {
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'CONFLICT',
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
};
