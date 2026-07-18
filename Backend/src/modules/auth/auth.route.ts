import express from 'express';
import { signUp, login, logout, refreshToken, getMe } from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { validateBody } from '../../middlewares/validateRequest.js';
import { registerSchema, loginSchema } from './auth.schema.js';

const router = express.Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), signUp);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

export default router;