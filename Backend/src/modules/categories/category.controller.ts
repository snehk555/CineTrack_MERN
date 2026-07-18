import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Category from '../../models/category.model.js';
import { NotFoundError } from '../../utils/AppError.js';

export const addCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.create(req.body);
  sendCreated(res, { category }, 'Category added successfully');
});

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await Category.find().lean();
  sendSuccess(res, { categories }, 'Categories fetched');
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new NotFoundError('Category');
  sendSuccess(res, null, 'Category deleted');
});
