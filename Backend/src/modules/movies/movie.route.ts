import express from 'express';
import { addMovie, getMovies, getMovieById, updateWatchedStatus, deleteMovie } from './movie.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

// ─── Public-ish (require login) ───────────────────────────────────────────────
router.get('/',          protect, getMovies);       // GET /api/v1/movies
router.get('/:id',       protect, getMovieById);    // GET /api/v1/movies/:id

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post('/',         protect, requireRole('admin'), addMovie);         // POST
router.patch('/:id',     protect, requireRole('admin'), updateWatchedStatus); // PATCH
router.delete('/:id',    protect, requireRole('admin'), deleteMovie);      // DELETE

export default router;
