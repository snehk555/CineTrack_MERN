import express from 'express';
import { addCategory, getCategories, deleteCategory } from './category.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/',     protect, getCategories);                          // GET  /api/v1/categories
router.post('/',    protect, requireRole('admin'), addCategory);      // POST /api/v1/categories
router.delete('/:id', protect, requireRole('admin'), deleteCategory); // DELETE

export default router;
