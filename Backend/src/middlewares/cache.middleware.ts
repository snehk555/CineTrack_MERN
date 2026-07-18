import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
        res.status(200).json(JSON.parse(cached));
        return;
      }
    } catch (err) {
      logger.warn('Cache read failed, falling through to controller', { err });
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch((err) => {
          logger.warn('Cache write failed', { err });
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `cache:${pattern}`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn('Cache invalidation failed', { err });
  }
};
