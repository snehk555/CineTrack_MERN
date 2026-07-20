import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Genre from '../../models/genre.model.js';
import Movie from '../../models/movie.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';

// ─── Slug helper ──────────────────────────────────────────────────────────
const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── GET /api/v1/admin/genres ──────────────────────────────────────────────
export const listGenres = catchAsync(async (_req: Request, res: Response) => {
  const genres = await Genre.find().sort({ name: 1 }).lean();

  // Attach movie count to each genre
  const counts = await Movie.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: '$genreIds' },
    { $group: { _id: '$genreIds', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));

  const result = genres.map(g => ({
    ...g,
    movieCount: countMap.get(g._id.toString()) ?? 0,
  }));

  sendSuccess(res, result, 'Genres fetched');
});

// ─── POST /api/v1/admin/genres ─────────────────────────────────────────────
export const createGenre = catchAsync(async (req: Request, res: Response) => {
  const { name, color } = req.body as { name: string; color?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminId = (req as any).user?.userId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminName = (req as any).user?.name ?? 'Admin';

  const slug = toSlug(name);
  const exists = await Genre.findOne({ $or: [{ name }, { slug }] });
  if (exists) throw new AppError('Genre already exists', 409, 'DUPLICATE');

  const genre = await Genre.create({ name, slug, color: color ?? '#6366f1', createdBy: adminId });

  logAdminAction({ adminId, adminName, action: 'GENRE_CREATED', targetName: name, req });

  sendCreated(res, genre, 'Genre created');
});

// ─── PATCH /api/v1/admin/genres/:id ───────────────────────────────────────
export const updateGenre = catchAsync(async (req: Request, res: Response) => {
  const { name, color } = req.body as { name?: string; color?: string };

  const update: Record<string, string> = {};
  if (name)  { update['name'] = name; update['slug'] = toSlug(name); }
  if (color) { update['color'] = color; }

  const genre = await Genre.findByIdAndUpdate(req.params['id'], update, { new: true });
  if (!genre) throw new NotFoundError('Genre');

  sendSuccess(res, genre, 'Genre updated');
});

// ─── DELETE /api/v1/admin/genres/:id ──────────────────────────────────────
export const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  const genre = await Genre.findById(req.params['id']);
  if (!genre) throw new NotFoundError('Genre');

  // Block delete if movies use this genre
  const movieCount = await Movie.countDocuments({ genreIds: genre._id, isDeleted: false });
  if (movieCount > 0) {
    throw new AppError(
      `Cannot delete — ${movieCount} movie(s) use this genre. Remove them first.`,
      409,
      'GENRE_IN_USE'
    );
  }

  await Genre.findByIdAndDelete(genre._id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminId = (req as any).user?.userId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminName = (req as any).user?.name ?? 'Admin';
  logAdminAction({ adminId, adminName, action: 'GENRE_DELETED', targetName: genre.name, req });

  sendSuccess(res, null, 'Genre deleted');
});
