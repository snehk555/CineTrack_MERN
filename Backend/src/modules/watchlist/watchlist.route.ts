import express from 'express';
import { addToWatchList, getUserWatchlist, removeFromWatchlist } from './watchlist.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, addToWatchList);
router.get('/', protect, getUserWatchlist);
router.delete('/:movieId', protect, removeFromWatchlist);

export default router;
