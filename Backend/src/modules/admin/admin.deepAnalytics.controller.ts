import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import User from '../../models/user.model.js';
import Movie from '../../models/movie.model.js';
import UserActivity from '../../models/userActivity.model.js';

// ─── GET /api/v1/admin/analytics/funnel?days=30 ───────────────────────────────
// Conversion funnel: Registered → Watched → Watchlisted → Premium
export const getConversionFunnel = catchAsync(async (req: Request, res: Response) => {
  const days  = Math.max(Number(req.query['days'] ?? 30), 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalUsers, watchedUserIds, watchlistUserIds, premiumUsers] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: since } }),
    UserActivity.distinct('userId', { event: 'MOVIE_VIEW',      createdAt: { $gte: since } }),
    UserActivity.distinct('userId', { event: 'WATCHLIST_ADD',   createdAt: { $gte: since } }),
    User.countDocuments({ subscriptionPlan: { $ne: 'free' },    createdAt: { $gte: since } }),
  ]);

  const total = totalUsers || 1; // avoid division by zero

  sendSuccess(res, {
    days,
    funnel: [
      { stage: 'Registered',       count: totalUsers,                  pct: 100 },
      { stage: 'Watched a Movie',  count: watchedUserIds.length,       pct: +((watchedUserIds.length   / total) * 100).toFixed(1) },
      { stage: 'Added Watchlist',  count: watchlistUserIds.length,     pct: +((watchlistUserIds.length / total) * 100).toFixed(1) },
      { stage: 'Upgraded Premium', count: premiumUsers,                pct: +((premiumUsers            / total) * 100).toFixed(1) },
    ],
  }, 'Conversion funnel');
});

// ─── GET /api/v1/admin/analytics/content-performance?limit=10 ─────────────────
// Top movies by composite score = (watchlistAdds × 0.3) + (avgRating × 8) + (reviewCount × 0.3)
export const getContentPerformance = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query['limit'] ?? 10), 50);

  const movies = await Movie.aggregate([
    { $match: { isDeleted: false } },
    {
      $addFields: {
        // Composite score formula from roadmap
        performanceScore: {
          $add: [
            { $multiply: ['$totalWatchlists', 0.3] },
            { $multiply: ['$averageRating',   8.0] }, // ×8 to normalize 0-10 scale
            { $multiply: ['$totalReviews',    0.3] },
          ],
        },
      },
    },
    { $sort: { performanceScore: -1 } },
    { $limit: limit },
    {
      $project: {
        title: 1, posterPath: 1, releaseYear: 1,
        totalWatchlists: 1, averageRating: 1, totalReviews: 1,
        performanceScore: { $round: ['$performanceScore', 1] },
        status: 1,
      },
    },
  ]);

  sendSuccess(res, movies, 'Content performance');
});

// ─── GET /api/v1/admin/analytics/churn-signal ─────────────────────────────────
// Users inactive for 14 / 30 / 60 days — churn risk tiers
export const getChurnSignal = catchAsync(async (_req: Request, res: Response) => {
  const now = Date.now();
  const d14  = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const d30  = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const d60  = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [total, inactive14, inactive30, inactive60, inactive14LastWeek] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLoginAt: { $lt: d14 } }),
    User.countDocuments({ lastLoginAt: { $lt: d30 } }),
    User.countDocuments({ lastLoginAt: { $lt: d60 } }),
    User.countDocuments({ lastLoginAt: { $lt: new Date(now - 7 * 24 * 60 * 60 * 1000 - 14 * 24 * 60 * 60 * 1000), $gte: lastWeek } }),
  ]);

  const pct = (n: number) => total > 0 ? +((n / total) * 100).toFixed(1) : 0;

  sendSuccess(res, {
    total,
    inactive14: { count: inactive14, pct: pct(inactive14) },
    inactive30: { count: inactive30, pct: pct(inactive30) },
    inactive60: { count: inactive60, pct: pct(inactive60) },
    weeklyTrend: inactive14LastWeek, // how many newly became inactive since last week
  }, 'Churn signal');
});

// ─── GET /api/v1/admin/analytics/heatmap?days=30 ─────────────────────────────
// Peak usage heatmap — activity count grouped by dayOfWeek × hour
export const getPeakUsageHeatmap = catchAsync(async (req: Request, res: Response) => {
  const days  = Math.max(Number(req.query['days'] ?? 30), 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const buckets = await UserActivity.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          hour:      { $hour: '$createdAt' },        // 0-23
          dayOfWeek: { $dayOfWeek: '$createdAt' },   // 1=Sun … 7=Sat
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
  ]);

  // Flatten into a simple array: [{ day, hour, count }]
  const heatmap = buckets.map(b => ({
    day:   b._id.dayOfWeek as number,  // 1-7
    hour:  b._id.hour      as number,  // 0-23
    count: b.count         as number,
  }));

  sendSuccess(res, { days, heatmap }, 'Peak usage heatmap');
});
