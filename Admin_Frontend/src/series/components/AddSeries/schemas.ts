import { z } from 'zod';

export const addSeriesSchema = z.object({
  tmdbId: z.number(),
  title: z.string().min(1, 'Title is required'),
  overview: z.string().min(1, 'Overview is required'),
  releaseYear: z.number().optional(),
  averageRating: z.number().optional(),
  totalRatings: z.number().optional(),
  spokenLanguage: z.string().optional(),
  contentRating: z.string().optional(),
  posterPath: z.string().optional(),
  bannerPath: z.string().optional(),
  trailerUrl: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  
  genreIds: z.array(z.string()).min(1, 'Select at least one genre'),
  categoryId: z.string().optional(),
  
  director: z.string().optional(),
  actors: z.array(z.object({
    name: z.string(),
    role: z.string(),
    profilePath: z.string().optional(),
  })).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  publishAt: z.date().optional(),
});

export type AddSeriesFormValues = z.infer<typeof addSeriesSchema>;
