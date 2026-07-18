import { z } from 'zod';

export const addMovieSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters'),
});

export const addReviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating must be at most 10'),
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review max 1000 characters')
    .optional(),
});

export const movieFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  genre: z.string().optional(),
  sortBy: z.enum(['createdAt', 'rating', 'title', 'releaseYear']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type AddMovieSearchFormData = z.infer<typeof addMovieSearchSchema>;
export type AddReviewFormData = z.infer<typeof addReviewSchema>;
export type MovieFilterFormData = z.infer<typeof movieFilterSchema>;
