import { z } from 'zod';
import { mongoIdSchema } from '../../middlewares/validateRequest.js';
import { addMovieSchema } from '../movies/movie.schema.js';

export const createMovieAdminSchema = addMovieSchema.extend({
  isPublished: z.boolean().default(false),
  featuredUntil: z.coerce.date().optional(),
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
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type CreateMovieAdminInput = z.infer<typeof createMovieAdminSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
