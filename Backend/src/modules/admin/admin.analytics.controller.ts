import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import User from '../../models/user.model.js';
import AuditLog from '../../models/auditLog.model.js';
import { redis } from '../../config/redis.js';
import { emailQueue } from '../../queues/emailQueue.js';
import { mediaQueue } from '../../queues/mediaQueue.js';
import mongoose from 'mongoose';

// ─── Helper: get start of today ───────────────────────────────────────────
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ─── GET /api/v1/admin/dashboard/stats ────────────────────────────────────
export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    activeToday,
    premiumUsers,
    bannedUsers,
    newToday,
    newYesterday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: startOfToday() } }),
    User.countDocuments({ subscriptionPlan: { $ne: 'free' } }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ createdAt: { $gte: startOfToday() } }),
    User.countDocuments({
      createdAt: {
        $gte: daysAgo(2),
        $lt: startOfToday(),
      },
    }),
  ]);

  sendSuccess(res, {
    totalUsers,
    activeToday,
    premiumUsers,
    bannedUsers,
    newToday,
    newYesterday,
    userGrowthDelta: newToday - newYesterday,
  }, 'Dashboard stats');
});

// ─── GET /api/v1/admin/dashboard/registrations ───────────────────────────
export const getRegistrationTrend = catchAsync(async (req: Request, res: Response) => {
  const days = Math.min(Number(req.query['days'] ?? 7), 90);

  const data = await User.aggregate([
    { $match: { createdAt: { $gte: daysAgo(days) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);

  sendSuccess(res, data, 'Registration trend');
});

// ─── GET /api/v1/admin/dashboard/recent-activity ─────────────────────────
export const getRecentActivity = catchAsync(async (_req: Request, res: Response) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  sendSuccess(res, logs, 'Recent activity');
});

// ─── GET /api/v1/admin/health ─────────────────────────────────────────────
export const getHealthStatus = catchAsync(async (_req: Request, res: Response) => {
  // DB check
  let dbStatus = 'connected';
  let dbPingMs = 0;
  try {
    const t = Date.now();
    await mongoose.connection.db?.command({ ping: 1 });
    dbPingMs = Date.now() - t;
  } catch {
    dbStatus = 'error';
  }

  // Redis check
  let redisStatus = 'connected';
  let redisPingMs = 0;
  try {
    const t = Date.now();
    await redis.ping();
    redisPingMs = Date.now() - t;
  } catch {
    redisStatus = 'error';
  }

  // BullMQ queue counts
  const [emailCounts, mediaCounts] = await Promise.all([
    Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]).catch(() => [0, 0, 0, 0]),
    Promise.all([
      mediaQueue.getWaitingCount(),
      mediaQueue.getActiveCount(),
      mediaQueue.getCompletedCount(),
      mediaQueue.getFailedCount(),
    ]).catch(() => [0, 0, 0, 0]),
  ]);

  // Server
  const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;

  sendSuccess(res, {
    db:     { status: dbStatus, pingMs: dbPingMs },
    redis:  { status: redisStatus, pingMs: redisPingMs },
    queues: {
      emails: { waiting: emailCounts[0], active: emailCounts[1], completed: emailCounts[2], failed: emailCounts[3] },
      media:  { waiting: mediaCounts[0], active: mediaCounts[1], completed: mediaCounts[2], failed: mediaCounts[3] },
    },
    server: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsedMB: Math.round(memUsed),
      nodeVersion: process.version,
    },
  }, 'Health status');
});

// ─── GET /api/v1/admin/audit-logs ────────────────────────────────────────
export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(Number(req.query['page']  ?? 1), 1);
  const limit  = Math.min(Number(req.query['limit'] ?? 20), 100);
  const action = req.query['action'] as string | undefined;
  const adminId = req.query['adminId'] as string | undefined;

  const filter: Record<string, unknown> = {};
  if (action)  filter['action']  = action;
  if (adminId && mongoose.isValidObjectId(adminId)) {
    filter['adminId'] = new mongoose.Types.ObjectId(adminId);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }, 'Audit logs');
});
