import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import Genre from '../../models/genre.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';

export const addGenre = catchAsync(async (req: Request, res: Response) => {
  let { name, slug, color } = req.body;
  
  if (name) {
    // Convert to Title Case
    name = name.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
  }

  // Check if it's already in use
  const existingGenre = await Genre.findOne({ slug });
  if (existingGenre) {
    throw new AppError('Genre is already in use', 409, 'CONFLICT');
  }

  const genre = await Genre.create({ name, slug, color, createdBy: req.body.createdBy });
  sendCreated(res, { genre }, 'Genre added successfully');
});

export const getGenre = catchAsync(async (_req: Request, res: Response) => {
  const genres = await Genre.find().lean();
  sendSuccess(res, genres, 'Genres fetched');
});

export const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  const genre = await Genre.findByIdAndDelete(req.params.id);
  if (!genre) throw new NotFoundError('Genre');
  sendSuccess(res, null, 'Genre deleted');
});