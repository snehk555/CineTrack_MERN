import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';

export const signUp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, res);
  sendCreated(res, result, 'Registration successful');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, res);
  sendSuccess(res, result, 'Login successful');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken ?? '';
  await authService.logout(refreshToken, res);
  sendSuccess(res, null, 'Logged out successfully');
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken ?? '';
  const result = await authService.refreshTokens(token, res);
  sendSuccess(res, result, 'Tokens refreshed');
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, { user }, 'User profile fetched');
});