import { z } from 'zod';
import { mongoIdSchema } from '../../middlewares/validateRequest.js';
import { addMovieSchema } from '../movies/movie.schema.js';

export const addMovieAdminSchema = addMovieSchema.extend({
  status: z.enum(['published', 'draft', 'archived']).default('draft'),
  featuredUntil: z.coerce.date().optional(),
  trailerUrl: z.string().url().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  directors: z.array(z.string()).optional(),
});

export const updateMovieStatusSchema = z.object({
  status: z.enum(['published', 'draft', 'archived']),
});

export const updateUserRoleSchema = z.object({
  userId: mongoIdSchema,
  role: z.enum(['user', 'premium', 'moderator', 'admin']),
});

export const banUserSchema = z.object({
  userId: mongoIdSchema,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  duration: z.number().int().positive().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type AddMovieInput = z.infer<typeof addMovieAdminSchema>;
export type UpdateMovieStatusInput = z.infer<typeof updateMovieStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
