import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import Review from '../../models/review.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActor = (req: Request) => ({ id: (req as any).user?.userId ?? '', name: (req as any).user?.name ?? 'Admin' });

// ─── GET /api/v1/admin/reviews ─────────────────────────────────────────────────
// Paginated reviews filtered by status: pending | approved | rejected
export const listReviews = catchAsync(async (req: Request, res: Response) => {
  const status = (req.query['status'] as string | undefined) ?? 'pending';
  const page   = Math.max(Number(req.query['page']  ?? 1), 1);
  const limit  = Math.min(Number(req.query['limit'] ?? 20), 100);
  const movieId = req.query['movieId'] as string | undefined;

  const VALID_STATUSES = ['pending', 'approved', 'rejected'];
  if (!VALID_STATUSES.includes(status)) throw new AppError('Invalid status filter', 400);

  const filter: Record<string, unknown> = { status };
  if (movieId && mongoose.isValidObjectId(movieId)) {
    filter['movieId'] = new mongoose.Types.ObjectId(movieId);
  }

  const [reviews, total, counts] = await Promise.all([
    Review.find(filter)
      .populate('userId',  'name username avatarUrl')
      .populate('movieId', 'title posterPath')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    // Tab counts — how many in each status
    Review.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const tabCounts = {
    pending:  0,
    approved: 0,
    rejected: 0,
    ...Object.fromEntries(counts.map((c: { _id: string; count: number }) => [c._id, c.count])),
  };

  sendSuccess(res, { data: reviews, total, page, limit, totalPages: Math.ceil(total / limit), tabCounts }, 'Reviews fetched');
});

// ─── PATCH /api/v1/admin/reviews/:id/approve ──────────────────────────────────
export const approveReview = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const review = await Review.findByIdAndUpdate(
    req.params['id'],
    { status: 'approved', $unset: { rejectionReason: 1 } },
    { new: true }
  ).populate('userId', 'name').populate('movieId', 'title');
  if (!review) throw new NotFoundError('Review');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'REVIEW_APPROVED',
    targetId: review._id.toString(), targetType: 'Review',
    metadata: { movieId: review.movieId?.toString() }, req,
  });

  sendSuccess(res, review, 'Review approved');
});

// ─── PATCH /api/v1/admin/reviews/:id/reject ───────────────────────────────────
export const rejectReview = catchAsync(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const actor = getActor(req);

  const review = await Review.findByIdAndUpdate(
    req.params['id'],
    { status: 'rejected', rejectionReason: reason },
    { new: true }
  ).populate('userId', 'name').populate('movieId', 'title');
  if (!review) throw new NotFoundError('Review');

  // TODO (Phase 5): Queue rejection notification email to user via BullMQ
  // await addReviewRejectionEmailJob({ userId: review.userId.toString(), movieTitle: ..., reason });

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'REVIEW_REJECTED',
    targetId: review._id.toString(), targetType: 'Review',
    metadata: { reason, movieId: review.movieId?.toString() }, req,
  });

  sendSuccess(res, review, 'Review rejected');
});

// ─── DELETE /api/v1/admin/reviews/:id ─────────────────────────────────────────
export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const review = await Review.findByIdAndDelete(req.params['id']);
  if (!review) throw new NotFoundError('Review');

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'REVIEW_DELETED',
    targetId: review._id.toString(), targetType: 'Review', req,
  });

  sendSuccess(res, null, 'Review deleted');
});

// ─── POST /api/v1/admin/reviews/bulk ──────────────────────────────────────────
// Bulk approve or reject multiple reviews at once
export const bulkReviewAction = catchAsync(async (req: Request, res: Response) => {
  const { ids, action, reason } = req.body as {
    ids: string[];
    action: 'approve' | 'reject';
    reason?: string;
  };
  const actor = getActor(req);

  if (!ids?.length) throw new AppError('ids array is required', 400);
  if (!['approve', 'reject'].includes(action)) throw new AppError('action must be approve or reject', 400);

  const validIds = ids
    .filter(id => mongoose.isValidObjectId(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
  };
  if (action === 'reject' && reason) update['rejectionReason'] = reason;

  const result = await Review.updateMany({ _id: { $in: validIds } }, update);

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: action === 'approve' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
    metadata: { bulk: true, count: result.modifiedCount, reason }, req,
  });

  sendSuccess(res, { affected: result.modifiedCount }, `Bulk ${action} complete`);
});
