import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';


const createRedisClient = (): Redis => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('ready', () => logger.info('Redis ready'));
  client.on('error', (err: Error) => logger.error('Redis error:', { message: err.message }));
  client.on('close', () => logger.warn('Redis connection closed'));

  return client;
};

export const redis = createRedisClient();
