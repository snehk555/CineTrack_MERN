import express from 'express';
import { addToWatchList, getUserWatchlist } from './watchlist.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/add', protect, addToWatchList);
router.get('/', protect, getUserWatchlist);

export default router;
