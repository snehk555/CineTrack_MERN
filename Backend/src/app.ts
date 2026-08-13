import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { protect } from './middlewares/auth.middleware.js';
import { requireRole } from './middlewares/rbac.middleware.js';
import { maintenanceGuard } from './middlewares/maintenanceGuard.middleware.js';
import authRoutes    from './modules/auth/auth.route.js';
import adminRoutes   from './modules/admin/admin.route.js';
import adminAuthRoutes from './modules/admin/admin.auth.route.js';
import movieRoutes    from './modules/movies/movie.route.js';
import seriesRoutes   from './modules/series/series.route.js';
import categoryRoutes from './modules/categories/category.route.js';
import genreRoutes    from './modules/genres/genre.route.js';
import watchlistRoutes from './modules/watchlist/watchlist.route.js';
import userRoutes     from './modules/users/user.route.js';
import reviewRoutes   from './modules/reviews/review.route.js';
import feedRoutes     from './modules/feed/feed.route.js';
import { getPublicFlags } from './modules/admin/admin.featureFlags.controller.js';
import { getPublicPlans } from './modules/admin/admin.settings.controller.js';
import { emailQueue } from './queues/emailQueue.js';
import { mediaQueue } from './queues/mediaQueue.js';
import { startScheduledJobs } from './queues/scheduledJobs.js';

import './workers/emailWorker.js';
import './workers/mediaWorker.js';

const app = express();

import path from 'path';

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions)); // Handle preflight properly

app.use('/media', express.static(path.join(process.cwd(), 'public', 'media')));

const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
  
// ─── BullBoard UI (protected — admin only) ────────────────────────────────────
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue), new BullMQAdapter(mediaQueue)],
  serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', protect, requireRole('admin'), bullBoardAdapter.getRouter());

// ─── Rate Limiter (all /api/ routes) ─────────────────────────────────────────
app.use('/api/', apiRateLimiter);

// ─── Admin routes (no maintenance guard — admins always have access) ──────────
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin',      adminRoutes);

// ─── Public endpoints (no auth, no maintenance guard) ─────────────────────────
app.get('/api/v1/flags', getPublicFlags);   // Feature flags map for consumer app
app.get('/api/v1/plans', getPublicPlans);   // Subscription pricing page

// ─── Maintenance Guard → User Auth Routes ─────────────────────────────────────
app.use('/api/v1', maintenanceGuard);
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/movies',     movieRoutes);
app.use('/api/v1/series',     seriesRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/genres',     genreRoutes);
app.use('/api/v1/watchlist',  watchlistRoutes);
app.use('/api/v1/users',      userRoutes);
app.use('/api/v1/reviews',    reviewRoutes);
app.use('/api/v1/feed',       feedRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success:     true,
    message:     'Server is running',
    environment: env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── Background Jobs ──────────────────────────────────────────────────────────
startScheduledJobs();

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export { app };
