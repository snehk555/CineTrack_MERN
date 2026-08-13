import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Movie from '../../models/movie.model.js';
import { NotFoundError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';
import mongoose from 'mongoose';
import { invalidateCache } from '../../middlewares/cache.middleware.js';

// ─── GET /api/v1/admin/movies/v2 ──────────────────────────────────────────
// Full paginated list with search, status, genre filters
export const listMoviesAdmin = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(Number(req.query['page']  ?? 1), 1);
  const limit  = Math.min(Number(req.query['limit'] ?? 20), 100);
  const search = (req.query['search'] as string | undefined)?.trim();
  const status = req.query['status'] as string | undefined;
  const genreId= req.query['genreId'] as string | undefined;
  const sort   = (req.query['sort'] as string | undefined) ?? 'createdAt';
  const order  = req.query['order'] === 'asc' ? 1 : -1;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (search)  filter['$text'] = { $search: search };
  if (status)  filter['status'] = status;
  if (genreId && mongoose.isValidObjectId(genreId)) {
    filter['genreIds'] = new mongoose.Types.ObjectId(genreId);
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter)
      .select('title posterPath status isFeatured averageRating totalWatchlists genreIds processingStatus createdAt')
      .populate('genreIds', 'name color')
      .sort({ [sort]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Movie.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: movies,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }, 'Movies fetched');
});

// ─── GET /api/v1/admin/movies/check-duplicate ─────────────────────────────
export const checkDuplicate = catchAsync(async (req: Request, res: Response) => {
  const title = (req.query['title'] as string | undefined)?.trim();
  if (!title) { sendSuccess(res, [], 'No similar movies'); return; }

  // Normalize: remove articles and punctuation for comparison
  const normalized = title.toLowerCase().replace(/^(the|a|an)\s+/i, '').trim();
  const similar = await Movie.find({
    isDeleted: false,
    title: { $regex: normalized.split(' ').join('|'), $options: 'i' },
  }).select('title posterPath releaseYear').limit(3).lean();

  sendSuccess(res, similar, 'Duplicate check');
});

// ─── PATCH /api/v1/admin/movies/:id/status (v2) ───────────────────────────
export const setMovieStatus = catchAsync(async (req: Request, res: Response) => {
  const { status, publishAt } = req.body as { status: string; publishAt?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminId   = (req as any).user?.userId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminName = (req as any).user?.name ?? 'Admin';

  const update: Record<string, unknown> = { status };
  if (publishAt) update['publishAt'] = new Date(publishAt);

  const movie = await Movie.findByIdAndUpdate(req.params['id'], update, { new: true });
  if (!movie) throw new NotFoundError('Movie');

  const action = status === 'published' ? 'MOVIE_PUBLISHED' : 'MOVIE_DELETED';
  logAdminAction({ adminId, adminName, action, targetId: movie._id.toString(), targetType: 'Movie', targetName: movie.title, req });

  await invalidateCache(`movie:${movie._id}`);
  await invalidateCache('movies:*');
  await invalidateCache('feed:featured');

  sendSuccess(res, movie, `Movie status updated to ${status}`);
});

// ─── PATCH /api/v1/admin/movies/:id/feature ───────────────────────────────
export const toggleFeature = catchAsync(async (req: Request, res: Response) => {
  const movie = await Movie.findById(req.params['id']);
  if (!movie) throw new NotFoundError('Movie');
  movie.isFeatured = !movie.isFeatured;
  await movie.save();
  
  await invalidateCache(`movie:${movie._id}`);
  await invalidateCache('movies:*');
  await invalidateCache('feed:featured');
  
  sendSuccess(res, { isFeatured: movie.isFeatured }, `Movie ${movie.isFeatured ? 'featured' : 'unfeatured'}`);
});

// ─── DELETE /api/v1/admin/movies/:id (soft delete) ────────────────────────
export const softDeleteMovie = catchAsync(async (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminId   = (req as any).user?.userId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminName = (req as any).user?.name ?? 'Admin';

  const movie = await Movie.findById(req.params['id']);
  if (!movie) throw new NotFoundError('Movie');

  const ArchivedMovie = (await import('../../models/archivedMovie.model.js')).default;
  await ArchivedMovie.create({
    originalMovieId: movie._id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    slug: movie.slug,
    restoreData: movie.toObject()
  });
  await Movie.findByIdAndDelete(movie._id);

  logAdminAction({ adminId, adminName, action: 'MOVIE_DELETED', targetId: movie._id.toString(), targetType: 'Movie', targetName: movie.title, req });

  await invalidateCache(`movie:${movie._id}`);
  await invalidateCache('movies:*');
  await invalidateCache('feed:featured');

  sendSuccess(res, null, 'Movie deleted and archived');
});

// ─── POST /api/v1/admin/movies/bulk ───────────────────────────────────────
// Bulk publish/unpublish/delete
export const bulkMovieAction = catchAsync(async (req: Request, res: Response) => {
  const { ids, action } = req.body as { ids: string[]; action: 'publish' | 'unpublish' | 'delete' };

  const validIds = ids.filter(id => mongoose.isValidObjectId(id))
    .map(id => new mongoose.Types.ObjectId(id));

  if (action === 'delete') {
    const moviesToDelete = await Movie.find({ _id: { $in: validIds } });
    if (moviesToDelete.length > 0) {
      const ArchivedMovie = (await import('../../models/archivedMovie.model.js')).default;
      const archiveDocs = moviesToDelete.map(m => ({
        originalMovieId: m._id,
        tmdbId: m.tmdbId,
        title: m.title,
        slug: m.slug,
        restoreData: m.toObject()
      }));
      await ArchivedMovie.insertMany(archiveDocs);
      await Movie.deleteMany({ _id: { $in: validIds } });
    }
  } else {
    const status = action === 'publish' ? 'published' : 'draft';
    await Movie.updateMany({ _id: { $in: validIds } }, { status });
  }

  for (const id of validIds) {
    await invalidateCache(`movie:${id}`);
  }
  await invalidateCache('movies:*');
  await invalidateCache('feed:featured');

  sendSuccess(res, { affected: validIds.length }, `Bulk ${action} complete`);
});
