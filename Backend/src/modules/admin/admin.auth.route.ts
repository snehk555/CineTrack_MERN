import express from 'express';
import { z } from 'zod';
import { validateBody } from '../../middlewares/validateRequest.js';
import { adminProtect } from '../../middlewares/adminAuth.middleware.js';
import {
  adminLogin,
  adminRefresh,
  adminLogout,
  adminGetMe,
} from './admin.auth.controller.js';

const router = express.Router();

// ─── Validation schemas ───────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Public admin auth routes ─────────────────────────────────────────────
// POST /api/v1/admin/auth/login
router.post('/login', validateBody(loginSchema), adminLogin);

// POST /api/v1/admin/auth/refresh  (reads adminRefreshToken cookie)
router.post('/refresh', adminRefresh);

// ─── Protected admin auth routes ──────────────────────────────────────────
// POST /api/v1/admin/auth/logout
router.post('/logout', adminProtect, adminLogout);

// GET /api/v1/admin/auth/me
router.get('/me', adminProtect, adminGetMe);

export default router;
