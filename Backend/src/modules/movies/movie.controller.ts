import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse.js';
import { movieService } from './movie.service.js';

export const addMovie = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.addMovie(req.body);
  sendCreated(res, { movie }, 'Movie added successfully');
});

export const getMovies = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getAllMovies(req.body);
  sendSuccess(res, result, 'Movies fetched');
});

export const getMovieById = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.getMovieById(req.params['id'] as string);
  sendSuccess(res, { movie }, 'Movie fetched');
});

export const updateWatchedStatus = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.updateMovie(req.params['id'] as string, req.body);
  sendSuccess(res, { movie }, 'Movie updated');
});

export const deleteMovie = catchAsync(async (req: Request, res: Response) => {
  await movieService.deleteMovie(req.params['id'] as string);
  sendNoContent(res);
});

export const searchMovies = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getAllMovies(req.body);
  sendSuccess(res, result, 'Search results fetched');
});

export const getTrending = catchAsync(async (_req: Request, res: Response) => {
  const movies = await movieService.getTrendingMovies();
  sendSuccess(res, { movies }, 'Trending movies fetched');
});