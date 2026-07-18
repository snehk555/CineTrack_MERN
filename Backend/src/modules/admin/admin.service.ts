import User from '../../models/user.model.js';
import Movie from '../../models/movie.model.js';
import Subscription from '../../models/subscription.model.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError } from '../../utils/AppError.js';
import { invalidateCache } from '../../middlewares/cache.middleware.js';
import { UpdateUserRoleInput, BanUserInput } from './admin.schema.js';

export const adminService = {
  async getDashboardStats() {
    const cacheKey = 'cache:admin:dashboard';
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      usersByRole,
      totalMovies,
      moviesByStatus,
      activeSubscriptions,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Movie.countDocuments({ isDeleted: false }),
      Movie.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: 'active' }),
    ]);

    const stats = {
      users: { total: totalUsers, newToday: newUsersToday, newThisWeek: newUsersThisWeek, byRole: usersByRole },
      movies: { total: totalMovies, byStatus: moviesByStatus },
      subscriptions: { active: activeSubscriptions },
    };

    redis.setex(cacheKey, 300, JSON.stringify(stats)).catch(() => null);
    return stats;
  },

  async getAllUsers({ page = 1, limit = 20, role, isBanned }: { page?: number; limit?: number; role?: string; isBanned?: boolean }) {
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (typeof isBanned === 'boolean') filter.isBanned = isBanned;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateUserRole(data: UpdateUserRoleInput, adminId: string) {
    const user = await User.findByIdAndUpdate(
      data.userId,
      { $set: { role: data.role } },
      { new: true }
    ).select('-password').lean();

    if (!user) throw new NotFoundError('User');

    logger.info(`Admin ${adminId} changed user ${data.userId} role to ${data.role}`);
    return user;
  },

  async banUser(data: BanUserInput, adminId: string) {
    const banUntil = data.duration ? new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000) : undefined;

    const user = await User.findByIdAndUpdate(
      data.userId,
      { $set: { isBanned: true, banReason: data.reason, banUntil } },
      { new: true }
    ).select('-password').lean();

    if (!user) throw new NotFoundError('User');

    logger.warn(`Admin ${adminId} banned user ${data.userId}: ${data.reason}`);
    return user;
  },

  async unbanUser(userId: string, adminId: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isBanned: false, banReason: undefined, banUntil: undefined } },
      { new: true }
    ).select('-password').lean();

    if (!user) throw new NotFoundError('User');

    logger.info(`Admin ${adminId} unbanned user ${userId}`);
    return user;
  },

  async featureMovie(movieId: string, featuredUntil?: Date) {
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { $set: { isFeatured: true, featuredUntil: featuredUntil ?? null } },
      { new: true }
    ).lean();

    if (!movie) throw new NotFoundError('Movie');
    await invalidateCache('movies:*');
    return movie;
  },
};
