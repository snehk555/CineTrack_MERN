import express from 'express';
import { getMovieReviews, submitReview, deleteMyReview } from './review.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validateParams, mongoIdParamsSchema } from '../../middlewares/validateRequest.js';

const router = express.Router();

router.get('/movie/:movieId', getMovieReviews);
router.post('/', protect, submitReview);
router.delete('/:id', protect, validateParams(mongoIdParamsSchema), deleteMyReview);

export default router;
