import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { adminService } from './admin.service.js';

// ─── Dashboard & Analytics ────────────────────────────────────────────────────
export const getDashboard = catchAsync(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, stats, 'Dashboard stats fetched');
});

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const range = (req.query.range as '7d' | '30d' | '90d') ?? '30d';
  const data = await adminService.getAnalytics(range);
  sendSuccess(res, data, 'Analytics fetched');
});

// ─── User Management ──────────────────────────────────────────────────────────
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const role = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;
  const isBannedQuery = req.query.isBanned as string | undefined;
  const isBanned = isBannedQuery !== undefined ? isBannedQuery === 'true' : undefined;

  const result = await adminService.getAllUsers({ page, limit, role, isBanned, search });
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

// ─── Movie Management ─────────────────────────────────────────────────────────
export const getAdminMovies = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const sortBy = (req.query.sortBy as string) ?? 'createdAt';
  const order = (req.query.order as 'asc' | 'desc') ?? 'desc';

  const result = await adminService.getAdminMovies({ page, limit, search, status, sortBy, order });
  sendSuccess(res, result, 'Movies fetched');
});

export const addMovie = catchAsync(async (req: Request, res: Response) => {
  const movie = await adminService.addMovie(req.body, req.user!.id);
  sendCreated(res, { movie }, 'Movie added successfully');
});

export const updateMovieStatus = catchAsync(async (req: Request, res: Response) => {
  const movie = await adminService.updateMovieStatus(
    req.params['id'] as string,
    req.body.status,
    req.user!.id
  );
  sendSuccess(res, { movie }, 'Movie status updated');
});

export const deleteMovie = catchAsync(async (req: Request, res: Response) => {
  await adminService.deleteMovie(req.params['id'] as string, req.user!.id);
  sendSuccess(res, null, 'Movie deleted');
});

export const featureMovie = catchAsync(async (req: Request, res: Response) => {
  const movie = await adminService.featureMovie(
    req.params['id'] as string,
    req.body.featuredUntil ? new Date(req.body.featuredUntil) : undefined
  );
  sendSuccess(res, { movie }, 'Movie featured');
});

// ─── Review Moderation ────────────────────────────────────────────────────────
export const getReviews = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const status = req.query.status as string | undefined;

  const result = await adminService.getReviews({ status, page, limit });
  sendSuccess(res, result, 'Reviews fetched');
});

export const approveReview = catchAsync(async (req: Request, res: Response) => {
  const review = await adminService.approveReview(req.params['id'] as string, req.user!.id);
  sendSuccess(res, { review }, 'Review approved');
});

export const rejectReview = catchAsync(async (req: Request, res: Response) => {
  await adminService.rejectReview(req.params['id'] as string, req.user!.id);
  sendSuccess(res, null, 'Review rejected and removed');
});
