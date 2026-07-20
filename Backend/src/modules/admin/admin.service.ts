import User from '../../models/user.model.js';
import Movie from '../../models/movie.model.js';
import Review from '../../models/review.model.js';
import Subscription from '../../models/subscription.model.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError, ConflictError } from '../../utils/AppError.js';
import { invalidateCache } from '../../middlewares/cache.middleware.js';
import { UpdateUserRoleInput, BanUserInput, AddMovieInput } from './admin.schema.js';
import { emitToUser, emitToAdmins } from '../../sockets/socketHandler.js';

export const adminService = {

  // ─── Dashboard Stats ────────────────────────────────────────────────────────
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
      pendingReviews,
      recentUsers,
      recentMovies,
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
      Review.countDocuments({ isApproved: false }),
      User.find().select('name email role createdAt avatarUrl').sort({ createdAt: -1 }).limit(5).lean(),
      Movie.find({ isDeleted: false }).select('title posterPath status averageRating totalWatchlists createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const stats = {
      users: { total: totalUsers, newToday: newUsersToday, newThisWeek: newUsersThisWeek, byRole: usersByRole },
      movies: { total: totalMovies, byStatus: moviesByStatus },
      subscriptions: { active: activeSubscriptions },
      reviews: { pending: pendingReviews },
      recentUsers,
      recentMovies,
    };

    redis.setex(cacheKey, 300, JSON.stringify(stats)).catch(() => null);
    return stats;
  },

  // ─── Analytics (date-range aware) ───────────────────────────────────────────
  async getAnalytics(range: '7d' | '30d' | '90d' = '30d') {
    const cacheKey = `cache:admin:analytics:${range}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily user registrations
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Top rated movies
    const topMovies = await Movie.find({ isDeleted: false, status: 'published' })
      .select('title averageRating totalRatings totalWatchlists posterPath')
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(10)
      .lean();

    // Genre distribution
    const genreDistribution = await Movie.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$genreIds' },
      { $group: { _id: '$genreIds', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'genres',
          localField: '_id',
          foreignField: '_id',
          as: 'genre',
        },
      },
      { $unwind: '$genre' },
      { $project: { name: '$genre.name', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Subscription plan distribution
    const subscriptionDistribution = await User.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
      { $project: { plan: '$_id', count: 1, _id: 0 } },
    ]);

    // Revenue estimate (₹99 free, ₹499 pro, ₹999 premium — mock)
    const PLAN_PRICES: Record<string, number> = { free: 0, pro: 499, premium: 999 };
    const monthlyRevenue = subscriptionDistribution.reduce((acc: number, p: { plan: string; count: number }) => {
      return acc + (PLAN_PRICES[p.plan] ?? 0) * p.count;
    }, 0);

    const result = {
      range,
      userGrowth,
      topMovies,
      genreDistribution,
      subscriptionDistribution,
      kpis: {
        totalRevenue: monthlyRevenue,
        avgRating: topMovies.reduce((s, m) => s + m.averageRating, 0) / (topMovies.length || 1),
        totalWatchlists: topMovies.reduce((s, m) => s + m.totalWatchlists, 0),
      },
    };

    redis.setex(cacheKey, 600, JSON.stringify(result)).catch(() => null);
    return result;
  },

  // ─── User Management ─────────────────────────────────────────────────────────
  async getAllUsers({
    page = 1,
    limit = 20,
    role,
    isBanned,
    search,
  }: {
    page?: number;
    limit?: number;
    role?: string;
    isBanned?: boolean;
    search?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (typeof isBanned === 'boolean') filter.isBanned = isBanned;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

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

    // Real-time: force logout the banned user immediately
    try {
      emitToUser(data.userId, 'user:banned', { reason: data.reason });
    } catch { /* Socket might not be initialized in test env */ }

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

  // ─── Movie Management ─────────────────────────────────────────────────────────
  async getAdminMovies({
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    order = 'desc',
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
    ];

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .select('title posterPath status isFeatured processingStatus averageRating totalWatchlists createdAt')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return { movies, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async addMovie(data: AddMovieInput, adminId: string) {
    const existing = await Movie.findOne({ tmdbId: data.tmdbId });
    if (existing) throw new ConflictError('Movie with this TMDB ID already exists');

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + data.tmdbId;
    
    // Add the videoUrl to videoUrls if provided, but keep status pending for the worker
    const videoUrls = data.videoUrl ? { default: data.videoUrl } : undefined;
    const movie = await Movie.create({ ...data, slug, processingStatus: 'pending', videoUrls });

    // Enqueue video processing job in BullMQ if videoUrl exists
    if (data.videoUrl) {
      import('../../queues/mediaQueue.js').then(({ addProcessVideoJob }) => {
        addProcessVideoJob({
          movieId: movie._id.toString(),
          filePath: data.videoUrl!, // Using the provided URL/path
          qualities: ['360p', '720p', '1080p'],
        }).catch(() => null);
      });
    }

    // Notify admins via socket
    try {
      emitToAdmins('movie:added', { movieId: movie._id, title: movie.title, adminId });
    } catch { /* ignore */ }

    await invalidateCache('movies:*');
    logger.info(`Admin ${adminId} added movie: ${movie.title}`);
    return movie;
  },

  async updateMovieStatus(movieId: string, status: 'published' | 'draft' | 'archived', adminId: string) {
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!movie) throw new NotFoundError('Movie');
    await invalidateCache('movies:*');
    logger.info(`Admin ${adminId} set movie ${movieId} status to ${status}`);
    return movie;
  },

  async deleteMovie(movieId: string, adminId: string) {
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!movie) throw new NotFoundError('Movie');
    await invalidateCache('movies:*');
    logger.warn(`Admin ${adminId} soft-deleted movie ${movieId}`);
    return movie;
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

  // ─── Review Moderation ────────────────────────────────────────────────────────
  async getReviews({ status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number }) {
    const filter: Record<string, unknown> = {};
    if (status === 'pending') filter.isApproved = false;
    else if (status === 'approved') filter.isApproved = true;

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name email avatarUrl')
        .populate('movieId', 'title posterPath')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async approveReview(reviewId: string, adminId: string) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { isApproved: true } },
      { new: true }
    ).lean();
    if (!review) throw new NotFoundError('Review');
    logger.info(`Admin ${adminId} approved review ${reviewId}`);
    return review;
  },

  async rejectReview(reviewId: string, adminId: string) {
    const review = await Review.findByIdAndDelete(reviewId).lean();
    if (!review) throw new NotFoundError('Review');
    logger.warn(`Admin ${adminId} rejected and deleted review ${reviewId}`);
    return { deleted: true };
  },
};
