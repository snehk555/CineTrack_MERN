import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Genre from '../../models/genre.model.js';
import { NotFoundError } from '../../utils/AppError.js';

export const addGenre = catchAsync(async (req: Request, res: Response) => {
  const genre = await Genre.create(req.body);
  sendCreated(res, { genre }, 'Genre added successfully');
});

export const getGenre = catchAsync(async (_req: Request, res: Response) => {
  const genres = await Genre.find().lean();
  sendSuccess(res, { genres }, 'Genres fetched');
});

export const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  const genre = await Genre.findByIdAndDelete(req.params.id);
  if (!genre) throw new NotFoundError('Genre');
  sendSuccess(res, null, 'Genre deleted');
});