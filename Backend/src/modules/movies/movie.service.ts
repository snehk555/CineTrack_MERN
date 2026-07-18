import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { AppError, NotFoundError, ConflictError } from '../../utils/AppError.js';
import { invalidateCache } from '../../middlewares/cache.middleware.js';
import { movieRepository } from './movie.repository.js';
import { AddMovieInput, UpdateMovieInput, MovieQueryInput } from './movie.schema.js';

const CACHE_TTL = 300;

export const movieService = {
  async getAllMovies(query: MovieQueryInput) {
    const cacheKey = `cache:movies:${JSON.stringify(query)}`;

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const result = await movieRepository.findAll(query);

    redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result)).catch((err) =>
      logger.warn('Movie list cache write failed', { err })
    );

    return result;
  },

  async getMovieById(id: string) {
    const cacheKey = `cache:movie:${id}`;

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const movie = await movieRepository.findById(id);
    if (!movie) throw new NotFoundError('Movie');

    redis.setex(cacheKey, CACHE_TTL, JSON.stringify(movie)).catch(() => null);
    return movie;
  },

  async addMovie(data: AddMovieInput) {
    const existing = await movieRepository.findByTmdbId(data.tmdbId);
    if (existing) throw new ConflictError('Movie with this TMDB ID already exists');

    const movie = await movieRepository.create(data);
    await invalidateCache('movies:*');

    logger.info(`Movie added: ${movie.title} (TMDB: ${data.tmdbId})`);
    return movie;
  },

  async updateMovie(id: string, data: UpdateMovieInput) {
    const movie = await movieRepository.update(id, data);
    if (!movie) throw new NotFoundError('Movie');

    await invalidateCache(`movie:${id}`);
    await invalidateCache('movies:*');
    return movie;
  },

  async deleteMovie(id: string) {
    const movie = await movieRepository.softDelete(id);
    if (!movie) throw new NotFoundError('Movie');

    await invalidateCache(`movie:${id}`);
    await invalidateCache('movies:*');
    logger.info(`Movie soft-deleted: ${id}`);
    return movie;
  },

  async getTrendingMovies() {
    const cacheKey = 'cache:movies:trending';

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const movies = await movieRepository.getTrending(10);

    redis.setex(cacheKey, 3600, JSON.stringify(movies)).catch(() => null);
    return movies;
  },

  async getStats() {
    return movieRepository.getAggregatedStats();
  },
};
