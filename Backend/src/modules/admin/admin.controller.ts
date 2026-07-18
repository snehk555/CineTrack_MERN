import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { adminService } from './admin.service.js';

export const getDashboard = catchAsync(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, stats, 'Dashboard stats fetched');
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const role = req.query.role as string | undefined;
  const isBannedQuery = req.query.isBanned as string | undefined;
  const isBanned = isBannedQuery !== undefined ? isBannedQuery === 'true' : undefined;

  const result = await adminService.getAllUsers({ page, limit, role, isBanned });
  sendSuccess(res, result, 'Users fetched');
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.updateUserRole(
    { userId: req.params['id'] as string, role: req.body.role },
    req.user!.id
  );
  sendSuccess(res, { user }, 'User role updated');
});

export const banUser = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.banUser(
    { userId: req.params['id'] as string, ...req.body },
    req.user!.id
  );
  sendSuccess(res, { user }, 'User banned');
});

export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.unbanUser(req.params['id'] as string, req.user!.id);
  sendSuccess(res, { user }, 'User unbanned');
});

export const featureMovie = catchAsync(async (req: Request, res: Response) => {
  const movie = await adminService.featureMovie(
    req.params['id'] as string,
    req.body.featuredUntil ? new Date(req.body.featuredUntil) : undefined
  );
  sendSuccess(res, { movie }, 'Movie featured');
});
