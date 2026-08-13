import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import Review from '../../models/review.model.js';
import Movie from '../../models/movie.model.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/AppError.js';

export const getMovieReviews = catchAsync(async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const query: any = { movieId, status: 'approved' };
  
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(query)
  ]);

  sendSuccess(res, {
    items: reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }, 'Reviews fetched successfully');
});

export const submitReview = catchAsync(async (req: Request, res: Response) => {
  const { movieId, rating, comment } = req.body;
  const userId = req.user!.id;

  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError('Movie not found', 404);

  const existingReview = await Review.findOne({ movieId, userId });
  if (existingReview) {
    throw new AppError('You have already reviewed this movie', 400);
  }

  if (!comment?.trim()) throw new AppError('Comment is required', 400);

  const review = await Review.create({
    movieId,
    userId,
    rating,       // optional — may be undefined
    comment: comment.trim(),
    status: 'approved' // comments go live immediately
  });

  sendCreated(res, review, 'Comment added successfully');
});

export const deleteMyReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const review = await Review.findOneAndDelete({ _id: id, userId });
  if (!review) {
    throw new AppError('Review not found or not authorized', 404);
  }

  sendSuccess(res, null, 'Review deleted successfully');
});
