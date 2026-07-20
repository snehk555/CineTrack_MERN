import express from 'express';
import passport from 'passport';
import { signUp, login, logout, refreshToken, getMe, googleCallback } from './auth.controller.js';
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

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), googleCallback);

export default router;