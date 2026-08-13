import { z } from 'zod';
import { mongoIdSchema } from '../../middlewares/validateRequest.js';

const currentYear = new Date().getFullYear();

export const addMovieSchema = z.object({
  tmdbId: z.number({ error: 'TMDB ID is required' }).int().positive(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  overview: z.string().optional(),
  releaseYear: z.number().int().min(1900).max(currentYear + 5).optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  runtime: z.number().int().min(1).max(600).optional(),
  categoryId: z.union([mongoIdSchema, z.literal('')]).optional().transform(val => val === '' ? undefined : val),
  genreIds: z.array(z.union([mongoIdSchema, z.literal('')])).optional().transform(arr => arr?.filter(val => val !== '')),
  contentRating: z.enum(['U', 'U/A', 'A']).optional(),
  type: z.enum(['Movie', 'Web Series']).default('Movie'),
  averageRating: z.number().min(0).max(10).optional(),
  totalRatings: z.number().int().min(0).optional(),
});

export const updateMovieSchema = addMovieSchema.partial();

export const movieQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  categoryId: mongoIdSchema.optional(),
  genreId: mongoIdSchema.optional(),
  sortBy: z.enum(['createdAt', 'rating', 'title', 'releaseYear']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const addReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating minimum is 1').max(10, 'Rating maximum is 10'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000).optional(),
});

export type AddMovieInput = z.infer<typeof addMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type MovieQueryInput = z.infer<typeof movieQuerySchema>;
export type AddReviewInput = z.infer<typeof addReviewSchema>;
