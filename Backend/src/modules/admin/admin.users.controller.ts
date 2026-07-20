import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import User from '../../models/user.model.js';
import Review from '../../models/review.model.js';
import AuditLog from '../../models/auditLog.model.js';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import mongoose from 'mongoose';

// ─── Helper: extract actor (admin) from request ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActor = (req: Request) => ({ id: (req as any).user?.userId ?? '', name: (req as any).user?.name ?? 'Admin' });

// ─── GET /api/v1/admin/users/v2 ───────────────────────────────────────────────
export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(Number(req.query['page']  ?? 1), 1);
  const limit  = Math.min(Number(req.query['limit'] ?? 25), 100);
  const search = (req.query['search'] as string | undefined)?.trim();
  const role   = req.query['role']   as string | undefined;
  const plan   = req.query['plan']   as string | undefined;
  const banned = req.query['banned'] as string | undefined;
  const sort   = (req.query['sort']  as string | undefined) ?? 'createdAt';
  const order  = req.query['order'] === 'asc' ? 1 : -1;

  const filter: Record<string, unknown> = {};
  if (role)               filter['role'] = role;
  if (plan)               filter['subscriptionPlan'] = plan;
  if (banned === 'true')  filter['isBanned'] = true;
  if (banned === 'false') filter['isBanned'] = false;

  if (search) {
    const rx = { $regex: search, $options: 'i' };
    filter['$or'] = [{ name: rx }, { email: rx }, { username: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name username email role subscriptionPlan isBanned isActive suspendedUntil lastLoginAt createdAt avatarUrl')
      .sort({ [sort]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { data: users, total, page, limit, totalPages: Math.ceil(total / limit) }, 'Users fetched');
});

// ─── GET /api/v1/admin/users/v2/stats ─────────────────────────────────────────
export const getUserStats = catchAsync(async (_req: Request, res: Response) => {
  const [byRole, byPlan, banned, suspended, newThisWeek] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }]),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ suspendedUntil: { $gt: new Date() } }),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  sendSuccess(res, {
    byRole:     Object.fromEntries(byRole.map(r => [r._id, r.count])),
    byPlan:     Object.fromEntries(byPlan.map(p => [p._id, p.count])),
    banned,
    suspended,
    newThisWeek,
  }, 'User stats');
});

// ─── GET /api/v1/admin/users/v2/:id ───────────────────────────────────────────
export const getUserDetail = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params['id'])
    .select('-password -twoFASecret')
    .lean();
  if (!user) throw new NotFoundError('User');
  sendSuccess(res, user, 'User detail');
});

// ─── GET /api/v1/admin/users/v2/:id/timeline ──────────────────────────────────
// Chronological view of all events for a user (audit logs + reviews)
export const getUserTimeline = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params['id'];
  if (!mongoose.isValidObjectId(userId)) throw new AppError('Invalid user ID', 400);

  const user = await User.findById(userId).select('name username email role subscriptionPlan isBanned suspendedUntil lastLoginAt createdAt avatarUrl').lean();
  if (!user) throw new NotFoundError('User');

  // Fetch relevant audit log entries (actions targeting this user)
  const objId = new mongoose.Types.ObjectId(userId as string);
  const auditEvents = await AuditLog.find({ targetId: objId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Fetch reviews written by this user
  const reviews = await Review.find({ userId: objId })
    .populate('movieId', 'title')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Combine and sort all events chronologically
  const timeline: Array<{
    type: string;
    label: string;
    detail?: string;
    date: Date;
    icon: string;
  }> = [];

  // Account created
  timeline.push({
    type:   'ACCOUNT_CREATED',
    label:  'Account created',
    date:   user.createdAt as Date,
    icon:   '👤',
  });

  // Audit log events
  for (const event of auditEvents) {
    timeline.push({
      type:   event.action,
      label:  event.action.replace(/_/g, ' '),
      detail: event.metadata ? JSON.stringify(event.metadata) : undefined,
      date:   event.createdAt as Date,
      icon:   event.action.includes('BANNED') ? '🚫' : event.action.includes('ROLE') ? '🎭' : event.action.includes('PLAN') ? '💳' : '⚙️',
    });
  }

  // Review events
  for (const review of reviews) {
    const movieTitle = (review.movieId as unknown as { title?: string })?.title ?? 'a movie';
    timeline.push({
      type:   'REVIEW_SUBMITTED',
      label:  `Reviewed "${movieTitle}" — ${review.rating}/10`,
      detail: review.comment?.slice(0, 80),
      date:   review.createdAt as Date,
      icon:   '⭐',
    });
  }

  // Sort combined timeline newest first
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sendSuccess(res, { user, timeline }, 'User timeline');
});

// ─── PATCH /api/v1/admin/users/v2/:id/role ────────────────────────────────────
export const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body as { role: string };
  const actor = getActor(req);

  const VALID_ROLES = ['user', 'premium', 'moderator', 'admin', 'super_admin'];
  if (!VALID_ROLES.includes(role)) throw new AppError('Invalid role', 400, 'INVALID_ROLE');

  const target = await User.findById(req.params['id']).select('-password');
  if (!target) throw new NotFoundError('User');

  // Self-protection: cannot change own role
  if (target._id.toString() === actor.id) {
    throw new ForbiddenError('You cannot change your own role.');
  }

  // Super-admin protection: only super_admin can demote another super_admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorRole = (req as any).user?.role;
  if (target.role === 'super_admin' && actorRole !== 'super_admin') {
    throw new ForbiddenError('Only a super_admin can modify another super_admin account.');
  }

  const oldRole = target.role;
  target.role = role as IUser['role'];
  await target.save();

  // Blacklist all existing tokens of this user (forces re-login with new role)
  await redis.setex(`user_role_changed:${target._id}`, 24 * 60 * 60, role).catch(() => null);

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_ROLE_CHANGED',
    targetId: target._id.toString(), targetType: 'User', targetName: target.name,
    metadata: { oldRole, newRole: role }, req,
  });

  sendSuccess(res, { user: target }, 'Role updated');
});

// ─── PATCH /api/v1/admin/users/v2/:id/plan ────────────────────────────────────
export const changeUserPlan = catchAsync(async (req: Request, res: Response) => {
  const { plan, expiresAt } = req.body as { plan: string; expiresAt?: string };
  const actor = getActor(req);

  const VALID_PLANS = ['free', 'pro', 'premium'];
  if (!VALID_PLANS.includes(plan)) throw new AppError('Invalid plan', 400, 'INVALID_PLAN');

  const update: Record<string, unknown> = { subscriptionPlan: plan };
  if (expiresAt) update['subscriptionExpiresAt'] = new Date(expiresAt);

  const user = await User.findByIdAndUpdate(req.params['id'], update, { new: true }).select('-password');
  if (!user) throw new NotFoundError('User');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_PLAN_CHANGED',
    targetId: user._id.toString(), targetType: 'User', targetName: user.name,
    metadata: { newPlan: plan }, req,
  });

  sendSuccess(res, { user }, 'Plan updated');
});

// ─── PATCH /api/v1/admin/users/v2/:id/ban ─────────────────────────────────────
export const banUser = catchAsync(async (req: Request, res: Response) => {
  const { reason, banUntil } = req.body as { reason?: string; banUntil?: string };
  const actor = getActor(req);

  if (req.params['id'] === actor.id) throw new AppError('You cannot ban yourself', 400, 'SELF_BAN');

  const target = await User.findById(req.params['id']).select('-password');
  if (!target) throw new NotFoundError('User');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorRole = (req as any).user?.role;
  if (target.role === 'super_admin' && actorRole !== 'super_admin') {
    throw new ForbiddenError('Only a super_admin can ban another super_admin account.');
  }

  const update: Record<string, unknown> = { isBanned: true, banReason: reason };
  if (banUntil) update['banUntil'] = new Date(banUntil);
  await User.findByIdAndUpdate(req.params['id'], update);

  // Blacklist user tokens in Redis — instant effect on next API call
  await redis.setex(`banned:${target._id}`, 7 * 24 * 60 * 60, '1').catch(() => null);

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_BANNED',
    targetId: target._id.toString(), targetType: 'User', targetName: target.name,
    metadata: { reason, banUntil }, req,
  });

  sendSuccess(res, null, 'User banned');
});

// ─── PATCH /api/v1/admin/users/v2/:id/unban ───────────────────────────────────
export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const user = await User.findByIdAndUpdate(
    req.params['id'],
    { isBanned: false, $unset: { banReason: 1, banUntil: 1 } },
    { new: true }
  ).select('-password');
  if (!user) throw new NotFoundError('User');

  await redis.del(`banned:${user._id}`).catch(() => null);

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_BANNED',
    targetId: user._id.toString(), targetType: 'User', targetName: user.name,
    metadata: { unbanned: true }, req,
  });

  sendSuccess(res, null, 'User unbanned');
});

// ─── PATCH /api/v1/admin/users/v2/:id/suspend ─────────────────────────────────
// Temporary suspension — auto-lifts when suspendedUntil date passes (per-request check)
export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const { duration, reason } = req.body as { duration: number; reason?: string };
  const actor = getActor(req);

  if (req.params['id'] === actor.id) throw new AppError('You cannot suspend yourself', 400, 'SELF_SUSPEND');

  if (!duration || duration <= 0) throw new AppError('duration (days) is required', 400);

  const suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

  const user = await User.findByIdAndUpdate(
    req.params['id'],
    { suspendedUntil, suspensionReason: reason },
    { new: true }
  ).select('-password');
  if (!user) throw new NotFoundError('User');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_SUSPENDED',
    targetId: user._id.toString(), targetType: 'User', targetName: user.name,
    metadata: { duration, reason, suspendedUntil }, req,
  });

  sendSuccess(res, { suspendedUntil }, `User suspended for ${duration} day(s)`);
});

// ─── PATCH /api/v1/admin/users/v2/:id/unsuspend ───────────────────────────────
export const unsuspendUser = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const user = await User.findByIdAndUpdate(
    req.params['id'],
    { $unset: { suspendedUntil: 1, suspensionReason: 1 } },
    { new: true }
  ).select('-password');
  if (!user) throw new NotFoundError('User');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_SUSPENDED',
    targetId: user._id.toString(), targetType: 'User', targetName: user.name,
    metadata: { unsuspended: true }, req,
  });

  sendSuccess(res, null, 'User suspension lifted');
});

// ─── POST /api/v1/admin/users/v2/:id/impersonate ──────────────────────────────
// Generates a short-lived read-only impersonation JWT for the target user
export const impersonateUser = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const target = await User.findById(req.params['id']).select('-password -twoFASecret').lean();
  if (!target) throw new NotFoundError('User');

  if (target.isBanned) throw new ForbiddenError('Cannot impersonate a banned user');
  if (target.role === 'super_admin') throw new ForbiddenError('Cannot impersonate a super_admin');

  // Generate a special short-lived impersonation token (5 minutes)
  const impersonationToken = jwt.sign(
    {
      userId:          target._id.toString(),
      role:            target.role,
      email:           target.email,
      isImpersonation: true,
      impersonatedBy:  actor.id,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' } as jwt.SignOptions
  );

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_IMPERSONATED',
    targetId: target._id.toString(), targetType: 'User', targetName: target.name,
    metadata: { targetEmail: target.email }, req,
  });

  // Return token — frontend opens consumer app with this token in-memory (not stored as cookie)
  sendSuccess(res, { impersonationToken, targetUser: { name: target.name, email: target.email, role: target.role } },
    'Impersonation token generated (expires in 5 minutes)');
});

// ─── GET /api/v1/admin/users/v2/export ────────────────────────────────────────
export const exportUsers = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);
  const role   = req.query['role'] as string | undefined;
  const fields = req.query['fields'] ? String(req.query['fields']).split(',') : ['name', 'username', 'email', 'role', 'subscriptionPlan', 'isBanned'];

  const filter: Record<string, unknown> = {};
  if (role) filter['role'] = role;

  const allowedFields = ['name', 'username', 'email', 'role', 'subscriptionPlan', 'isBanned', 'lastLoginAt', 'createdAt'];
  const selectFields = fields.filter(f => allowedFields.includes(f)).join(' ');

  const users = await User.find(filter).select(selectFields).lean();

  const header = fields.join(',') + '\n';
  const rows = users.map(u => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fields.map(f => {
      const val = (u as unknown as Record<string, unknown>)[f];
      if (val instanceof Date) return new Date(val).toISOString();
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return `"${String(val ?? '')}"`;
    }).join(',');
  }).join('\n');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'USER_DATA_EXPORTED',
    metadata: { fields, totalRows: users.length }, req,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
  res.send(header + rows);
});

// ─── Type import for IUser role field ─────────────────────────────────────────
import type { IUser } from '../../models/user.model.js';
