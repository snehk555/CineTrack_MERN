import { z } from 'zod';

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  releaseYear: z.number().min(1888, 'Invalid year').max(new Date().getFullYear() + 5, 'Invalid year'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  language: z.string().min(1, 'Language is required'),
  contentRating: z.enum(['U', 'U/A', 'A']),
  type: z.enum(['Movie', 'Web Series']),
  seasonCount: z.number().optional(),
});

// Step 2: Taxonomy
export const taxonomySchema = z.object({
  genreIds: z.array(z.string()).min(1, 'Select at least one genre'),
  tags: z.string().optional(), // Will be split by comma later
  category: z.string().optional(),
});

// Step 3: Cast & Crew
export const castCrewSchema = z.object({
  director: z.string().optional(),
  actors: z.array(
    z.object({
      name: z.string().min(1, 'Actor name is required'),
      role: z.string().min(1, 'Role is required'),
      profilePath: z.string().optional(),
    })
  ).optional(),
});

// Step 4: Media
export const mediaSchema = z.object({
  posterPath: z.string().min(1, 'Poster is required'),
  bannerPath: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  trailerUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// Step 5: Video (Validation for the final step mostly)
export const videoSchema = z.object({
  videoUrl: z.string().optional(),
});

// Master schema combining all
export const addMovieSchema = z.object({
  ...basicInfoSchema.shape,
  ...taxonomySchema.shape,
  ...castCrewSchema.shape,
  ...mediaSchema.shape,
  ...videoSchema.shape,
  status: z.enum(['draft', 'published', 'scheduled']),
  publishAt: z.date().optional(),
  tmdbId: z.number().optional(), // Store TMDB ID if fetched
});

export type AddMovieFormValues = z.infer<typeof addMovieSchema>;
