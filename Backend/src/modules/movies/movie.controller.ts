import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse.js';
import { validateQuery } from '../../middlewares/validateRequest.js';
import { movieService } from './movie.service.js';
import { movieQuerySchema } from './movie.schema.js';

// GET /api/v1/movies?page=1&limit=12&search=&categoryId=&genreId=&sortBy=&order=
export const getMovies = [
  validateQuery(movieQuerySchema),
  catchAsync(async (req: Request, res: Response) => {
    const result = await movieService.getAllMovies(req.query as never);
    sendSuccess(res, result, 'Movies fetched');
  }),
];

// GET /api/v1/movies/trending
export const getTrending = catchAsync(async (_req: Request, res: Response) => {
  const movies = await movieService.getTrendingMovies();
  sendSuccess(res, movies, 'Trending movies fetched');
});

// GET /api/v1/movies/:id
export const getMovieById = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.getMovieById(req.params['id'] as string);
  sendSuccess(res, { movie }, 'Movie fetched');
});

// POST /api/v1/movies (admin only)
export const addMovie = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.addMovie(req.body);
  sendCreated(res, { movie }, 'Movie added successfully');
});

// PATCH /api/v1/movies/:id (admin only)
export const updateWatchedStatus = catchAsync(async (req: Request, res: Response) => {
  const movie = await movieService.updateMovie(req.params['id'] as string, req.body);
  sendSuccess(res, { movie }, 'Movie updated');
});

// DELETE /api/v1/movies/:id (admin only)
export const deleteMovie = catchAsync(async (req: Request, res: Response) => {
  await movieService.deleteMovie(req.params['id'] as string);
  sendNoContent(res);
});