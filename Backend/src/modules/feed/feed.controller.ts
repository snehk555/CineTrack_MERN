import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import Movie from '../../models/movie.model.js';
import { redis } from '../../config/redis.js';

export const getLatestFeed = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 12;
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: { isDeleted: false, status: 'published' } },
    { $addFields: { _type: 'movie' } },
    { 
      $unionWith: { 
        coll: 'series', 
        pipeline: [
          { $match: { isDeleted: false, status: 'published' } },
          { $addFields: { _type: 'series' } }
        ] 
      } 
    },
    { $sort: { createdAt: -1 } as Record<string, 1 | -1> },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
        ]
      }
    }
  ];

  const results = await Movie.aggregate(pipeline);
  const data = results[0]?.data || [];
  const total = results[0]?.metadata[0]?.total || 0;
  
  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, { data, total, page, limit, totalPages }, 'Feed fetched successfully');
});

export const getFeaturedFeed = catchAsync(async (_req: Request, res: Response) => {
  const cacheKey = 'cache:feed:featured';
  const cached = await redis.get(cacheKey).catch(() => null);
  
  if (cached) {
    sendSuccess(res, JSON.parse(cached), 'Featured feed fetched successfully (cached)');
    return;
  }

  const pipeline = [
    { $match: { isDeleted: false, status: 'published', isFeatured: true } },
    { $addFields: { _type: 'movie' } },
    { 
      $unionWith: { 
        coll: 'series', 
        pipeline: [
          { $match: { isDeleted: false, status: 'published', isFeatured: true } },
          { $addFields: { _type: 'series' } }
        ] 
      } 
    },
    { $sort: { createdAt: -1 } as Record<string, 1 | -1> },
    { $limit: 10 }
  ];

  const results = await Movie.aggregate(pipeline);
  
  // Cache for 1 hour
  redis.setex(cacheKey, 3600, JSON.stringify(results)).catch(() => null);

  sendSuccess(res, results, 'Featured feed fetched successfully');
});
