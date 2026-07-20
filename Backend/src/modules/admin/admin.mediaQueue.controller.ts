import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError, NotFoundError } from '../../utils/AppError.js';
import { emailQueue } from '../../queues/emailQueue.js';
import { mediaQueue } from '../../queues/mediaQueue.js';

// ─── Helper: serialize a BullMQ job into a safe plain object ─────────────────
const serializeJob = (job: import('bullmq').Job) => ({
  id:          job.id,
  name:        job.name,
  data:        job.data,
  progress:    job.progress,
  attemptsMade:job.attemptsMade,
  timestamp:   job.timestamp,
  processedOn: job.processedOn,
  finishedOn:  job.finishedOn,
  failedReason:job.failedReason,
  duration:    job.finishedOn && job.processedOn
    ? job.finishedOn - job.processedOn
    : null,
});

// ─── GET /api/v1/admin/media-queue ────────────────────────────────────────────
// Returns summary stats + paginated jobs for both queues
export const getQueueStats = catchAsync(async (req: Request, res: Response) => {
  const queueName = (req.query['queue'] as string | undefined) ?? 'media';
  const queue = queueName === 'email' ? emailQueue : mediaQueue;

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  sendSuccess(res, {
    queue: queueName,
    stats: { waiting, active, completed, failed, delayed },
  }, 'Queue stats');
});

// ─── GET /api/v1/admin/media-queue/jobs ───────────────────────────────────────
// Paginated list of jobs by status
export const getQueueJobs = catchAsync(async (req: Request, res: Response) => {
  const queueName = (req.query['queue']  as string | undefined) ?? 'media';
  const status    = (req.query['status'] as string | undefined) ?? 'active';
  const start     = Math.max(Number(req.query['start'] ?? 0), 0);
  const end       = start + Math.min(Number(req.query['limit'] ?? 20), 50) - 1;

  const VALID_STATUSES = ['waiting', 'active', 'completed', 'failed', 'delayed'];
  if (!VALID_STATUSES.includes(status)) throw new AppError('Invalid status', 400);

  const queue = queueName === 'email' ? emailQueue : mediaQueue;

  type BullStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  const jobs = await queue.getJobs([status as BullStatus], start, end);
  const serialized = jobs.map(serializeJob);

  sendSuccess(res, {
    queue: queueName,
    status,
    jobs: serialized,
    count: serialized.length,
  }, 'Queue jobs');
});

// ─── POST /api/v1/admin/media-queue/retry/:jobId ─────────────────────────────
// Retry a specific failed job
export const retryJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const queueName = (req.query['queue'] as string | undefined) ?? 'media';
  const queue = queueName === 'email' ? emailQueue : mediaQueue;

  const job = await queue.getJob(jobId);
  if (!job) throw new NotFoundError(`Job ${jobId}`);

  const state = await job.getState();
  if (state !== 'failed') throw new AppError('Only failed jobs can be retried', 400);

  await job.retry();

  sendSuccess(res, { jobId, queue: queueName }, `Job ${jobId} queued for retry`);
});

// ─── DELETE /api/v1/admin/media-queue/jobs/:jobId ────────────────────────────
// Remove a completed or failed job from the queue
export const removeJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const queueName = (req.query['queue'] as string | undefined) ?? 'media';
  const queue = queueName === 'email' ? emailQueue : mediaQueue;

  const job = await queue.getJob(jobId);
  if (!job) throw new NotFoundError(`Job ${jobId}`);

  await job.remove();

  sendSuccess(res, { jobId }, `Job ${jobId} removed`);
});
