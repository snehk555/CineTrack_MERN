import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';


import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { protect } from './middlewares/auth.middleware.js';
import { requireRole } from './middlewares/rbac.middleware.js';
import authRoutes from './modules/auth/auth.route.js';
import adminRoutes from './modules/admin/admin.route.js';
import { emailQueue } from './queues/emailQueue.js';
import { mediaQueue } from './queues/mediaQueue.js';
import { startScheduledJobs } from './queues/scheduledJobs.js';

import './workers/emailWorker.js';
import './workers/mediaWorker.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue), new BullMQAdapter(mediaQueue)],
  serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', protect, requireRole('admin'), bullBoardAdapter.getRouter());

app.use('/api/', apiRateLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

startScheduledJobs();

app.use(errorHandler);

export { app };
