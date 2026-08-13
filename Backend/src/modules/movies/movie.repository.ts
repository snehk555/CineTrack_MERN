import Movie from '../../models/movie.model.js';
import { MovieQueryInput, AddMovieInput, UpdateMovieInput } from './movie.schema.js';
import Credit from '../../models/credit.model.js';
import VideoAsset from '../../models/videoAsset.model.js';
import '../../models/person.model.js';

export const movieRepository = {
  async findAll({ page, limit, search, categoryId, genreId, sortBy, order }: MovieQueryInput) {
    const now = new Date();
    const filter: Record<string, unknown> = {
      status: 'published',
      isDeleted: false,
      $or: [{ publishAt: { $lte: now } }, { publishAt: { $exists: false } }],
    };

    if (search) {
      filter.$text = { $search: search };
    }
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (genreId) {
      filter.genreIds = genreId;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name icon')
        .populate('genreIds', 'name')
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return { data: movies, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
 
  async findById(id: string) {
    const movie = await Movie.findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name icon')
      .populate('genreIds', 'name')
      .lean();

    if (!movie) return null;

    // Backwards compatibility layer: stitch normalized models back into the old format
    const credits = await Credit.find({ movieId: id }).populate('personId').sort('order').lean();
    if (credits && credits.length > 0) {
      movie.cast = credits.filter(c => c.roleType === 'Actor').map((c: any) => ({
        name: c.personId?.name || 'Unknown',
        character: c.characterName || '',
        profilePath: c.personId?.profilePath
      }));
      movie.directors = credits.filter(c => c.roleType === 'Director').map((c: any) => c.personId?.name || 'Unknown');
    }

    const videoAsset = await VideoAsset.findOne({ movieId: id, type: 'Main' }).lean();
    if (videoAsset && videoAsset.resolutions) {
      const vUrls: Record<string, string> = {};
      videoAsset.resolutions.forEach(res => {
        vUrls[res.quality] = res.url;
      });
      movie.videoUrls = vUrls as any;
      if (videoAsset.processingStatus) movie.processingStatus = videoAsset.processingStatus;
      if (videoAsset.thumbnailUrl) movie.thumbnailUrl = videoAsset.thumbnailUrl;
      if (videoAsset.duration) movie.videoDuration = videoAsset.duration;
    }

    return movie;
  },

  async findByTmdbId(tmdbId: number) {
    return Movie.findOne({ tmdbId, isDeleted: false }).lean();
  },

  async create(data: AddMovieInput) {
    return Movie.create(data);
  },

  async update(id: string, data: UpdateMovieInput) {
    return Movie.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  },

  async softDelete(id: string) {
    return Movie.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true }).lean();
  },

  async getAggregatedStats() {
    return Movie.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byGenre: [{ $unwind: '$genreIds' }, { $group: { _id: '$genreIds', count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$categoryId', count: { $sum: 1 } } }],
        },
      },
    ]);
  },

  async getTrending(limit: number) {
    return Movie.find({ status: 'published', isDeleted: false })
      .sort({ averageRating: -1, totalWatchlists: -1 })
      .limit(limit)
      .lean();
  },
};
