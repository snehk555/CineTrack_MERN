import express from 'express'

import { addCategory, getCategories } from './category.controller.js'

const router = express.Router();

router.post('/add', addCategory);

router.get('/get', getCategories)

export default router;


