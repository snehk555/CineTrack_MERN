import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import {
  validateBody,
  validateParams,
  mongoIdParamsSchema,
} from '../../middlewares/validateRequest.js';
import {
  updateUserRoleSchema,
  banUserSchema,
  addMovieAdminSchema,
  updateMovieStatusSchema,
} from './admin.schema.js';
import {
  getDashboard,
  getAnalytics,
  getUsers,
  updateUserRole,
  banUser,
  unbanUser,
  getAdminMovies,
  addMovie,
  updateMovieStatus,
  deleteMovie,
  featureMovie,
  getReviews,
  approveReview,
  rejectReview,
} from './admin.controller.js';
import { searchTmdbMovies, getTmdbMovieDetails } from '../../utils/tmdbService.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { catchAsync } from '../../middlewares/catchAsync.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

// ─── Dashboard & Analytics ────────────────────────────────────────────────────
router.get('/analytics/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.patch('/users/:id/role', validateParams(mongoIdParamsSchema), validateBody(updateUserRoleSchema), updateUserRole);
router.patch('/users/:id/ban', validateParams(mongoIdParamsSchema), validateBody(banUserSchema), banUser);
router.patch('/users/:id/unban', validateParams(mongoIdParamsSchema), unbanUser);

// ─── Movie Management ─────────────────────────────────────────────────────────
router.get('/movies', getAdminMovies);
router.post('/movies', validateBody(addMovieAdminSchema), addMovie);
router.patch('/movies/:id/status', validateParams(mongoIdParamsSchema), validateBody(updateMovieStatusSchema), updateMovieStatus);
router.patch('/movies/:id/feature', validateParams(mongoIdParamsSchema), featureMovie);
router.delete('/movies/:id', validateParams(mongoIdParamsSchema), deleteMovie);

// ─── Review Moderation ────────────────────────────────────────────────────────
router.get('/reviews', getReviews);
router.patch('/reviews/:id/approve', validateParams(mongoIdParamsSchema), approveReview);
router.delete('/reviews/:id', validateParams(mongoIdParamsSchema), rejectReview);

// ─── TMDB Integration ─────────────────────────────────────────────────────────
router.get('/tmdb/search', catchAsync(async (req, res) => {
  const query = req.query.q as string;
  const page = req.query.page ? Number(req.query.page) : 1;
  if (!query) { res.status(400).json({ success: false, message: 'Query is required' }); return; }
  const results = await searchTmdbMovies(query, page);
  sendSuccess(res, results, 'TMDB search results');
}));

router.get('/tmdb/movie/:tmdbId', catchAsync(async (req, res) => {
  const tmdbId = Number(req.params['tmdbId']);
  if (isNaN(tmdbId)) { res.status(400).json({ success: false, message: 'Invalid TMDB ID' }); return; }
  const details = await getTmdbMovieDetails(tmdbId);
  sendSuccess(res, details, 'TMDB movie details');
}));

export default router;
