import express from 'express'

import { addCategory, getCategories } from '../controllers/category.controller.js'

const router = express.Router();

router.post('/add', addCategory);

router.get('/get', getCategories)

export default router;


