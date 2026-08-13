import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import Series from '../../models/series.model.js';
import Season from '../../models/season.model.js';
import Episode from '../../models/episode.model.js';
import { ConflictError, NotFoundError } from '../../utils/AppError.js';
import mongoose from 'mongoose';
import { invalidateCache } from '../../middlewares/cache.middleware.js';
import { getTmdbSeasonDetails, getTmdbEpisodeDetails } from '../../utils/tmdbSeasonService.js';
import { addProcessEpisodeVideoJob } from '../../queues/mediaQueue.js';

// ─── GET /api/v1/admin/series ─────────────────────────────────────────────
export const listSeriesAdmin = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(Number(req.query['page']  ?? 1), 1);
  const limit  = Math.min(Number(req.query['limit'] ?? 20), 100);
  const search = (req.query['search'] as string | undefined)?.trim();
  const sort   = (req.query['sort'] as string | undefined) ?? 'createdAt';
  const order  = req.query['order'] === 'asc' ? 1 : -1;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (search)  filter['$text'] = { $search: search };

  const [seriesListRaw, total] = await Promise.all([
    Series.find(filter)
      .select('title posterPath status isFeatured averageRating genreIds createdAt')
      .populate('genreIds', 'name color')
      .sort({ [sort]: order })
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
  }, 'Series fetched');
});

// ─── POST /api/v1/admin/series ────────────────────────────────────────────
export const addSeries = catchAsync(async (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { videoUrl, type, slug: _ignored, ...seriesData } = req.body;

  if (seriesData.tmdbId) {
    const existingSeries = await Series.findOne({ tmdbId: seriesData.tmdbId }).select('_id title');
    if (existingSeries) {
      throw new ConflictError(`"${existingSeries.title}" is already added as a web series`);
    }
  }

  // Auto-generate a URL-safe slug from the title + random suffix for uniqueness
  const baseSlug = (seriesData.title as string)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
  const uniqueSuffix = Math.random().toString(36).slice(2, 7);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  const series = await Series.create({ ...seriesData, slug });
  await invalidateCache('/api/v1/series*');
  sendSuccess(res, series, 'Series created successfully', 201);
});

// ─── GET /api/v1/admin/series/:id ─────────────────────────────────────────
export const getSeriesDetail = catchAsync(async (req: Request, res: Response) => {
  const series = await Series.findById(req.params.id).populate('genreIds');
  if (!series) throw new NotFoundError('Series');
  sendSuccess(res, series, 'Series details');
});

// ─── PATCH /api/v1/admin/series/:id ───────────────────────────────────────
export const updateSeries = catchAsync(async (req: Request, res: Response) => {
  const { slug: _ignored, ...updateData } = req.body;

  const series = await Series.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('genreIds');

  if (!series) throw new NotFoundError('Series');
  await invalidateCache('/api/v1/series*');
  sendSuccess(res, series, 'Series updated successfully');
});


// ─── POST /api/v1/admin/series/:id/seasons ────────────────────────────────
export const addSeason = catchAsync(async (req: Request, res: Response) => {
  const seriesId = req.params.id;
  const { seasonNumber } = req.body;

  const series = await Series.findById(seriesId);
  if (!series) throw new NotFoundError('Series');

  // Check if season already exists locally
  const existingSeason = await Season.findOne({ seriesId, seasonNumber });
  if (existingSeason) {
    res.status(400).json({ success: false, message: 'Season already added' });
    return;
  }

  // Fetch Season details from TMDB
  const seasonData = await getTmdbSeasonDetails(series.tmdbId, seasonNumber);

  const season = await Season.create({
    seriesId: series._id,
    seasonNumber: seasonData.season_number,
    title: seasonData.name,
    overview: seasonData.overview,
    posterPath: seasonData.poster_path ? `https://image.tmdb.org/t/p/original${seasonData.poster_path}` : series.posterPath,
    tmdbSeasonId: seasonData.id,
    episodeCount: seasonData.episodes.length,
    airDate: seasonData.air_date ? new Date(seasonData.air_date) : undefined,
  });

  // Create Episodes
  const episodes = seasonData.episodes.map((ep: any) => ({
    seriesId: series._id,
    seasonId: season._id,
    episodeNumber: ep.episode_number,
    title: ep.name,
    overview: ep.overview,
    runtime: ep.runtime,
    thumbnailUrl: ep.still_path ? `https://image.tmdb.org/t/p/original${ep.still_path}` : undefined,
    airDate: ep.air_date ? new Date(ep.air_date) : undefined,
  }));

  if (episodes.length > 0) {
    await Episode.insertMany(episodes);
  }

  // Update total seasons/episodes on Series
  const [totalSeasons, totalEpisodes] = await Promise.all([
    Season.countDocuments({ seriesId }),
    Episode.countDocuments({ seriesId }),
  ]);
  series.totalSeasons = totalSeasons;
  series.totalEpisodes = totalEpisodes;
  await series.save();

  sendSuccess(res, season, 'Season added successfully');
});

// ─── GET /api/v1/admin/series/:id/tmdb/season/:seasonNumber/episode/:episodeNumber ───
export const getTmdbEpisodeData = catchAsync(async (req: Request, res: Response) => {
  const seriesId = req.params.id;
  const seasonNumber = Number(req.params.seasonNumber);
  const episodeNumber = Number(req.params.episodeNumber);

  const series = await Series.findById(seriesId);
  if (!series) throw new NotFoundError('Series');

  // Check if Episode already exists locally
  let season = await Season.findOne({ seriesId, seasonNumber });
  if (season) {
    const existingEpisode = await Episode.findOne({ seriesId, seasonId: season._id, episodeNumber });
    if (existingEpisode) {
      throw new ConflictError(`Episode ${episodeNumber} is already added to Season ${seasonNumber}`);
    }
  }

  // Fetch specific episode with appended videos
  let tmdbEpisode;
  let seasonData;
  try {
    tmdbEpisode = await getTmdbEpisodeDetails(series.tmdbId, seasonNumber, episodeNumber);
    seasonData = await getTmdbSeasonDetails(series.tmdbId, seasonNumber); // Need season data for auto-create
  } catch (err) {
    throw new NotFoundError(`Episode ${episodeNumber} does not exist in Season ${seasonNumber} on TMDB`);
  }

  if (!tmdbEpisode) {
    throw new NotFoundError(`Episode ${episodeNumber} does not exist in Season ${seasonNumber} on TMDB`);
  }

  // Find trailer if available
  let trailerUrl = '';
  if (tmdbEpisode.videos && tmdbEpisode.videos.results) {
    const trailer = tmdbEpisode.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  sendSuccess(res, {
    ...tmdbEpisode,
    trailerUrl,
    tmdbSeasonData: seasonData // Send season data in case we need to create it later
  }, 'TMDB Episode Data fetched');
});

// ─── POST /api/v1/admin/series/:id/episodes ───────────────────────────────
export const saveDetailedEpisode = catchAsync(async (req: Request, res: Response) => {
  const seriesId = req.params.id;
  const {
    seasonNumber,
    episodeNumber,
    title,
    overview,
    runtime,
    thumbnailUrl,
    airDate,
    cast,
    screenshots,
    trailerUrl,
    videoUrls,
    tmdbSeasonData, // Optional: to auto-create season if missing
    rawVideoPath,   // Optional: path to local uploaded video file
    status,
    publishAt,
  } = req.body;

  const series = await Series.findById(seriesId);
  if (!series) throw new NotFoundError('Series');

  // Ensure Season exists locally
  let season = await Season.findOne({ seriesId, seasonNumber });
  if (!season) {
    if (!tmdbSeasonData) {
      throw new Error('tmdbSeasonData is required to create a new season');
    }
    season = await Season.create({
      seriesId: series._id,
      seasonNumber: tmdbSeasonData.season_number,
      title: tmdbSeasonData.name,
      overview: tmdbSeasonData.overview,
      posterPath: tmdbSeasonData.poster_path ? `https://image.tmdb.org/t/p/original${tmdbSeasonData.poster_path}` : series.posterPath,
      tmdbSeasonId: tmdbSeasonData.id,
      episodeCount: tmdbSeasonData.episodes?.length || 0,
      airDate: tmdbSeasonData.air_date ? new Date(tmdbSeasonData.air_date) : undefined,
    });
  }

  // Check if Episode already exists locally
  const existingEpisode = await Episode.findOne({ seriesId, seasonId: season._id, episodeNumber });
  if (existingEpisode) {
    throw new ConflictError(`Episode ${episodeNumber} is already added to Season ${seasonNumber}`);
  }

  // Create the single Episode
  const episode = await Episode.create({
    seriesId: series._id,
    seasonId: season._id,
    episodeNumber,
    title,
    overview,
    runtime,
    thumbnailUrl,
    airDate: airDate ? new Date(airDate) : undefined,
    cast: cast || [],
    screenshots: screenshots || [],
    trailerUrl,
    videoUrls: videoUrls || {},
    processingStatus: rawVideoPath ? 'processing' : 'pending',
    status: status || 'draft',
    publishAt: publishAt ? new Date(publishAt) : undefined,
  });

  // If there's a raw video path uploaded, send it to the queue
  if (rawVideoPath) {
    await addProcessEpisodeVideoJob({
      episodeId: episode._id.toString(),
      seriesId: series._id.toString(),
      seasonNumber,
      episodeNumber,
      filePath: rawVideoPath
    });
  }

  // Update total seasons/episodes on Series
  const [totalSeasons, totalEpisodes] = await Promise.all([
    Season.countDocuments({ seriesId }),
    Episode.countDocuments({ seriesId }),
  ]);
  series.totalSeasons = totalSeasons;
  series.totalEpisodes = totalEpisodes;
  await series.save();

  sendSuccess(res, episode, `Episode ${episodeNumber} added successfully`, 201);
});

// ─── GET /api/v1/admin/series/:id/seasons ─────────────────────────────────
export const getSeasons = catchAsync(async (req: Request, res: Response) => {
  const seasons = await Season.find({ seriesId: req.params.id }).sort({ seasonNumber: 1 });
  sendSuccess(res, seasons, 'Seasons fetched');
});

// ─── GET /api/v1/admin/series/:id/seasons/:seasonId/episodes ──────────────
export const getEpisodes = catchAsync(async (req: Request, res: Response) => {
  const episodes = await Episode.find({ seasonId: req.params.seasonId }).sort({ episodeNumber: 1 });
  sendSuccess(res, episodes, 'Episodes fetched');
});

// ─── PATCH /api/v1/admin/episodes/:episodeId/video ────────────────────────
export const updateEpisodeVideo = catchAsync(async (req: Request, res: Response) => {
  const { videoUrl, quality } = req.body;
  const episode = await Episode.findById(req.params.episodeId);
  if (!episode) throw new NotFoundError('Episode');

  const q = quality || 'default';
  episode.videoUrls.set(q, videoUrl);
  
  if (episode.processingStatus === 'pending' || episode.processingStatus === 'failed') {
    episode.processingStatus = 'ready';
  }

  await episode.save();

  sendSuccess(res, episode, 'Episode video updated');
});

// ─── PATCH /api/v1/admin/series/:id/status ─────────────────────────────────
export const updateSeriesStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const series = await Series.findById(req.params.id);
  if (!series) throw new NotFoundError('Series');

  series.status = status;
  await series.save();
  await invalidateCache('/api/v1/series*');

  sendSuccess(res, series, `Series status updated to ${status}`);
});

// ─── PATCH /api/v1/admin/episodes/:episodeId/status ────────────────────────
export const updateEpisodeStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const episode = await Episode.findById(req.params.episodeId);
  if (!episode) throw new NotFoundError('Episode');

  episode.status = status;
  await episode.save();
  await invalidateCache('/api/v1/series*');

  sendSuccess(res, episode, `Episode status updated to ${status}`);
});
