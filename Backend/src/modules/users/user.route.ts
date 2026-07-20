import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { getProfile, updateProfile, changePassword } from './user.controller.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/me',           getProfile);
router.patch('/me',         updateProfile);
router.patch('/me/password', changePassword);

export default router;
