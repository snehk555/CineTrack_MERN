import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { validateBody } from '../../middlewares/validateRequest.js';
import { userService } from './user.service.js';
import { updateProfileSchema } from './user.schema.js';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// GET /api/v1/users/me
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.id);
  sendSuccess(res, { user }, 'Profile fetched');
});

// PATCH /api/v1/users/me
export const updateProfile = [
  validateBody(updateProfileSchema),
  catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, { user }, 'Profile updated');
  }),
];

// PATCH /api/v1/users/me/password
export const changePassword = [
  validateBody(changePasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  }),
];
