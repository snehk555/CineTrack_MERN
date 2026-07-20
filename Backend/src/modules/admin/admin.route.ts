import express from 'express';
import { adminProtect } from '../../middlewares/adminAuth.middleware.js';
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
  approveReview  as legacyApproveReview,
  rejectReview   as legacyRejectReview,
} from './admin.controller.js';
import {
  getDashboardStats,
  getRegistrationTrend,
  getRecentActivity,
  getHealthStatus,
  getAuditLogs,
} from './admin.analytics.controller.js';
import { searchTmdbMovies, getTmdbMovieDetails } from '../../utils/tmdbService.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { listGenres, createGenre, updateGenre, deleteGenre as deleteGenreHandler } from './admin.genres.controller.js';
import { listMoviesAdmin, checkDuplicate, setMovieStatus, toggleFeature, softDeleteMovie, bulkMovieAction } from './admin.movies.controller.js';
import { uploadMedia } from './admin.upload.controller.js';
import multer from 'multer';

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
import {
  listUsers, getUserDetail, getUserTimeline,
  changeUserRole, changeUserPlan,
  banUser as banUserV2, unbanUser as unbanUserV2,
  suspendUser, unsuspendUser,
  impersonateUser, exportUsers, getUserStats,
} from './admin.users.controller.js';
import {
  listReviews, approveReview, rejectReview, deleteReview, bulkReviewAction,
} from './admin.reviews.controller.js';
import {
  getConversionFunnel, getContentPerformance, getChurnSignal, getPeakUsageHeatmap,
} from './admin.deepAnalytics.controller.js';
import {
  listFlags, createFlag, toggleFlag, updateFlag, deleteFlag,
} from './admin.featureFlags.controller.js';
import {
  getQueueStats, getQueueJobs, retryJob, removeJob,
} from './admin.mediaQueue.controller.js';
import {
  getSettings, updateSettings, enableMaintenance, disableMaintenance,
  listPlans, updatePlan, togglePlan,
  listWebhooks, createWebhook, toggleWebhook, testWebhook, deleteWebhook,
} from './admin.settings.controller.js';

const router = express.Router();

// All admin routes now use adminProtect (reads adminAccessToken cookie)
router.use(adminProtect);

// ─── Phase 2: Dashboard ──────────────────────────────────────────────────────
router.get('/dashboard/stats',        getDashboardStats);
router.get('/dashboard/registrations', getRegistrationTrend);
router.get('/dashboard/recent-activity', getRecentActivity);

// ─── Phase 2: Health & Audit Logs ────────────────────────────────────────────
router.get('/health',      getHealthStatus);
router.get('/audit-logs',  getAuditLogs);

import { listCategories, createCategory } from './admin.categories.controller.js';

// ─── Phase 3: Genres & Categories ─────────────────────────────────────────────
router.get('/genres',       listGenres);
router.post('/genres',      createGenre);
router.patch('/genres/:id', validateParams(mongoIdParamsSchema), updateGenre);
router.delete('/genres/:id', validateParams(mongoIdParamsSchema), deleteGenreHandler);

router.get('/categories',       listCategories);
router.post('/categories',      createCategory);

// ─── Phase 4: Media Upload ───────────────────────────────────────────────────
router.post('/upload',          upload.single('file'), uploadMedia);

// ─── Phase 3: Movies v2 ──────────────────────────────────────────────────────
router.get('/movies/v2',               listMoviesAdmin);
router.get('/movies/check-duplicate',  checkDuplicate);
router.post('/movies/bulk',            bulkMovieAction);
router.patch('/movies/v2/:id/status',  validateParams(mongoIdParamsSchema), setMovieStatus);
router.patch('/movies/v2/:id/feature', validateParams(mongoIdParamsSchema), toggleFeature);
router.delete('/movies/v2/:id',        validateParams(mongoIdParamsSchema), softDeleteMovie);

// ─── Legacy Dashboard & Analytics (keeping for backward compat) ──────────────
router.get('/analytics/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// ─── Phase 4: Users v2 ───────────────────────────────────────────────────────
router.get('/users/v2',                        listUsers);
router.get('/users/v2/stats',                  getUserStats);
router.get('/users/v2/export',                 exportUsers);
router.get('/users/v2/:id',                    validateParams(mongoIdParamsSchema), getUserDetail);
router.get('/users/v2/:id/timeline',           validateParams(mongoIdParamsSchema), getUserTimeline);
router.patch('/users/v2/:id/role',             validateParams(mongoIdParamsSchema), changeUserRole);
router.patch('/users/v2/:id/plan',             validateParams(mongoIdParamsSchema), changeUserPlan);
router.patch('/users/v2/:id/ban',              validateParams(mongoIdParamsSchema), banUserV2);
router.patch('/users/v2/:id/unban',            validateParams(mongoIdParamsSchema), unbanUserV2);
router.patch('/users/v2/:id/suspend',          validateParams(mongoIdParamsSchema), suspendUser);
router.patch('/users/v2/:id/unsuspend',        validateParams(mongoIdParamsSchema), unsuspendUser);
router.post('/users/v2/:id/impersonate',       validateParams(mongoIdParamsSchema), impersonateUser);

// ─── Phase 4: Reviews Moderation ─────────────────────────────────────────────
router.get('/reviews/v2',                      listReviews);
router.post('/reviews/v2/bulk',                bulkReviewAction);
router.patch('/reviews/v2/:id/approve',        validateParams(mongoIdParamsSchema), approveReview);
router.patch('/reviews/v2/:id/reject',         validateParams(mongoIdParamsSchema), rejectReview);
router.delete('/reviews/v2/:id',               validateParams(mongoIdParamsSchema), deleteReview);

// ─── Legacy User Management ───────────────────────────────────────────────────
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
router.patch('/reviews/:id/approve', validateParams(mongoIdParamsSchema), legacyApproveReview);
router.delete('/reviews/:id', validateParams(mongoIdParamsSchema), legacyRejectReview);

// ─── Phase 5: Deep Analytics ─────────────────────────────────────────────────
router.get('/analytics/funnel',              getConversionFunnel);
router.get('/analytics/content-performance', getContentPerformance);
router.get('/analytics/churn-signal',        getChurnSignal);
router.get('/analytics/heatmap',             getPeakUsageHeatmap);

// ─── Phase 5: Feature Flags ───────────────────────────────────────────────────
router.get('/feature-flags',                  listFlags);
router.post('/feature-flags',                 createFlag);
router.patch('/feature-flags/:key/toggle',    toggleFlag);
router.patch('/feature-flags/:key',           updateFlag);
router.delete('/feature-flags/:key',          deleteFlag);

// ─── Phase 5: Media Queue ─────────────────────────────────────────────────────
router.get('/media-queue',                    getQueueStats);
router.get('/media-queue/jobs',               getQueueJobs);
router.post('/media-queue/retry/:jobId',      retryJob);
router.delete('/media-queue/jobs/:jobId',     removeJob);

// ─── Phase 6: App Settings ────────────────────────────────────────────────────
router.get('/settings',                       getSettings);
router.patch('/settings',                     updateSettings);
router.post('/settings/maintenance/on',       enableMaintenance);
router.post('/settings/maintenance/off',      disableMaintenance);

// ─── Phase 6: Subscription Plans (admin) ──────────────────────────────────────
router.get('/plans',                          listPlans);
router.patch('/plans/:key',                   updatePlan);
router.patch('/plans/:key/toggle',            togglePlan);

// ─── Phase 6: Webhooks ────────────────────────────────────────────────────────
router.get('/webhooks',                       listWebhooks);
router.post('/webhooks',                      createWebhook);
router.patch('/webhooks/:id/toggle',          validateParams(mongoIdParamsSchema), toggleWebhook);
router.post('/webhooks/:id/test',             validateParams(mongoIdParamsSchema), testWebhook);
router.delete('/webhooks/:id',               validateParams(mongoIdParamsSchema), deleteWebhook);

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
