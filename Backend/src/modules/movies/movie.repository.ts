import Movie from '../../models/movie.model.js';
import { MovieQueryInput, AddMovieInput, UpdateMovieInput } from './movie.schema.js';

export const movieRepository = {
  async findAll({ page, limit, search, categoryId, genreId, sortBy, order }: MovieQueryInput) {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
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
    return Movie.findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name icon')
      .populate('genreIds', 'name')
      .lean();
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

  async getTrending(limit = 10) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Movie.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: sevenDaysAgo } } },
      { $sort: { watchlistCount: -1, createdAt: -1 } },
      { $limit: limit },
    ]);
  },
};
