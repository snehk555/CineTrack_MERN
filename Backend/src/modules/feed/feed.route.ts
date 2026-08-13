import { Router } from 'express';
import { getLatestFeed, getFeaturedFeed } from './feed.controller.js';

const router = Router();

// GET /api/v1/feed/featured
router.get('/featured', getFeaturedFeed);  

// GET /api/v1/feed
router.get('/', getLatestFeed);

export default router;
