import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { validateBody, validateParams, mongoIdParamsSchema } from '../../middlewares/validateRequest.js';
import { updateUserRoleSchema, banUserSchema } from './admin.schema.js';
import {
  getDashboard,
  getUsers,
  updateUserRole,
  banUser,
  unbanUser,
  featureMovie,
} from './admin.controller.js';

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/analytics/dashboard', getDashboard);

router.get('/users', getUsers);
router.patch('/users/:id/role', validateParams(mongoIdParamsSchema), validateBody(updateUserRoleSchema), updateUserRole);
router.patch('/users/:id/ban', validateParams(mongoIdParamsSchema), validateBody(banUserSchema), banUser);
router.patch('/users/:id/unban', validateParams(mongoIdParamsSchema), unbanUser);

router.patch('/movies/:id/feature', validateParams(mongoIdParamsSchema), featureMovie);

export default router;
