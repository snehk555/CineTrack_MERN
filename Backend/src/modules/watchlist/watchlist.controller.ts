import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { Watchlist } from '../../models/watchlist.model.js';
import { ConflictError, NotFoundError } from '../../utils/AppError.js';

export const addToWatchList = catchAsync(async (req: Request, res: Response) => {
  const { movieId } = req.body;
  const userId = req.user!.id;

  const existing = await Watchlist.findOne({ userId, movieId }).lean();
  if (existing) throw new ConflictError('Movie is already in your watchlist');

  const entry = await Watchlist.create({ userId, movieId });
  await entry.populate({ path: 'movieId', populate: ['categoryId', 'genreIds'] });

  sendCreated(res, { entry }, 'Added to watchlist');
});

export const getUserWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const watchlist = await Watchlist.find({ userId })
    .populate({ path: 'movieId', populate: ['categoryId', 'genreIds'] })
    .lean();
  sendSuccess(res, watchlist, 'Watchlist fetched');
});

export const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { movieId } = req.params;

  const entry = await Watchlist.findOneAndDelete({ userId, movieId });
  if (!entry) throw new NotFoundError('Watchlist entry');

  sendSuccess(res, null, 'Removed from watchlist');
});