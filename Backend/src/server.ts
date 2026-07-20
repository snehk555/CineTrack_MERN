import http from 'http';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { redis } from './config/redis.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initializeSocket } from './sockets/socketHandler.js';

const PORT = Number(env.PORT);

const httpServer = http.createServer(app);

// Initialize Socket.io — must be before listen()
initializeSocket(httpServer);

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection — shutting down', { reason });
  httpServer.close(() => process.exit(1));
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received — starting graceful shutdown`);
  httpServer.close(async () => {
    await redis.quit();
    logger.info('Redis disconnected');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${env.NODE_ENV}]`);
  });
};

startServer();
