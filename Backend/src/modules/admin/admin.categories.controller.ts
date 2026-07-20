import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Category from '../../models/category.model.js';
import { AppError } from '../../utils/AppError.js';

export const listCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  sendSuccess(res, categories, 'Categories fetched');
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  
  if (!name) throw new AppError('Category name is required', 400);

  const exists = await Category.findOne({ name: name.toLowerCase() });
  if (exists) throw new AppError('Category already exists', 409, 'DUPLICATE');

  const category = await Category.create({ name });
  sendCreated(res, category, 'Category created');
});
