import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { adminAuthService, clearAdminCookies } from './admin.auth.service.js';

// ─── POST /api/v1/admin/auth/login ────────────────────────────────────────
export const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await adminAuthService.login(email, password, res);
  sendSuccess(res, result, 'Login successful');
});

// ─── POST /api/v1/admin/auth/refresh ─────────────────────────────────────
export const adminRefresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies['adminRefreshToken'] as string;
  const result = await adminAuthService.refresh(refreshToken, res);
  sendSuccess(res, result, 'Token refreshed');
});

// ─── POST /api/v1/admin/auth/logout ──────────────────────────────────────
export const adminLogout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies['adminRefreshToken'] as string;
  await adminAuthService.logout(refreshToken, res);
  sendSuccess(res, null, 'Logged out successfully');
});

// ─── GET /api/v1/admin/auth/me ────────────────────────────────────────────
export const adminGetMe = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { userId: string } }).user?.userId;
  if (!userId) {
    clearAdminCookies(res);
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  const user = await adminAuthService.getMe(userId);
  sendSuccess(res, { user }, 'Admin profile fetched');
});
