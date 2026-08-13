import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import Series from '../../models/series.model.js';
import Season from '../../models/season.model.js';
import Episode from '../../models/episode.model.js';
import { NotFoundError } from '../../utils/AppError.js';

// ─── GET /api/v1/series (Public List) ──────────────────────────────────────
export const listSeriesPublic = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Number(req.query.limit ?? 12), 50);
  const search = (req.query.search as string | undefined)?.trim();
  const genreId = req.query.genreId as string | undefined;
  
  // Sorting options
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const sortQuery: Record<string, 1 | -1> = { [sortBy]: order };

  const filter: Record<string, unknown> = {
    status: 'published',
    isDeleted: false,
  };

  if (search) filter['$text'] = { $search: search };
  if (genreId) filter['genreIds'] = genreId;

  const [seriesListRaw, total] = await Promise.all([
    Series.find(filter)
      .select('title posterPath backdropPath releaseYear averageRating genreIds createdAt processingStatus slug')
      .populate('genreIds', 'name color')
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Series.countDocuments(filter),
  ]);

  const seriesIds = seriesListRaw.map(s => s._id);
  const seasonsData = await Season.aggregate([
    { $match: { seriesId: { $in: seriesIds } } },
    { $group: { _id: '$seriesId', totalSeasons: { $sum: 1 }, totalEpisodes: { $sum: '$episodeCount' } } }
  ]);

  const seriesList = seriesListRaw.map(series => {
    const sData = seasonsData.find(sd => sd._id.toString() === series._id.toString());
    return {
      ...series,
      totalSeasons: sData ? sData.totalSeasons : 0,
      totalEpisodes: sData ? sData.totalEpisodes : 0
    };
  });

  sendSuccess(res, {
    data: seriesList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
  }, 'Series fetched');
});

// ─── GET /api/v1/series/:id (Public Detail) ────────────────────────────────
export const getSeriesDetailPublic = catchAsync(async (req: Request, res: Response) => {
  const seriesRaw = await Series.findOne({ _id: req.params.id, status: 'published', isDeleted: false })
    .populate('genreIds', 'name color')
    .lean();

  if (!seriesRaw) throw new NotFoundError('Series not found or not published');

  const seasonsData = await Season.aggregate([
    { $match: { seriesId: seriesRaw._id } },
    { $group: { _id: '$seriesId', totalSeasons: { $sum: 1 }, totalEpisodes: { $sum: '$episodeCount' } } }
  ]);

  const series = {
    ...seriesRaw,
    totalSeasons: seasonsData.length > 0 ? seasonsData[0].totalSeasons : 0,
    totalEpisodes: seasonsData.length > 0 ? seasonsData[0].totalEpisodes : 0
  };

  sendSuccess(res, { series }, 'Series details');
});

// ─── GET /api/v1/series/:id/seasons (Public Seasons) ────────────────────────
export const getPublicSeasons = catchAsync(async (req: Request, res: Response) => {
  // Ensure the series is published before returning seasons
  const series = await Series.findOne({ _id: req.params.id, status: 'published', isDeleted: false });
  if (!series) throw new NotFoundError('Series not found');

  const seasons = await Season.find({ seriesId: req.params.id }).sort({ seasonNumber: 1 }).lean();
  sendSuccess(res, seasons, 'Seasons fetched');
});

// ─── GET /api/v1/series/:id/seasons/:seasonId/episodes (Public Episodes) ────
export const getPublicEpisodes = catchAsync(async (req: Request, res: Response) => {
  const now = new Date();
  const episodes = await Episode.find({
    seasonId: req.params.seasonId,
    status: 'published',
    $or: [{ publishAt: { $lte: now } }, { publishAt: { $exists: false } }]
  }).sort({ episodeNumber: 1 }).lean();
  sendSuccess(res, episodes, 'Episodes fetched');
});

