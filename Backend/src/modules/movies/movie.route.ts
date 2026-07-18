import express from 'express';
import { addMovie, getMovies, updateWatchedStatus, deleteMovie, searchMovies } from './movie.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.post('/add', protect, requireRole('admin'), addMovie);
router.delete('/delete/:id', protect, requireRole('admin'), deleteMovie);

router.get('/all', protect, getMovies);
router.patch('/update/:id', protect, updateWatchedStatus);
router.get('/search', protect, searchMovies);

export default router;




