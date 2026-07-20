import express from 'express';
import { addGenre, getGenre, deleteGenre } from './genre.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/',       protect, getGenre);                           // GET  /api/v1/genres
router.post('/',      protect, requireRole('admin'), addGenre);     // POST /api/v1/genres
router.delete('/:id', protect, requireRole('admin'), deleteGenre);  // DELETE

export default router;