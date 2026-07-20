import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export interface ProcessPosterJob {
  movieId: string;
  imageUrl: string;
}

export interface ProcessVideoJob {
  movieId: string;
  filePath: string;
  qualities: ('360p' | '720p' | '1080p')[];
}

export interface CleanupMediaJob {
  olderThanDays: number;
}

export type MediaJobData =
  | { type: 'process-poster'; payload: ProcessPosterJob }
  | { type: 'process-video'; payload: ProcessVideoJob }
  | { type: 'cleanup-old-media'; payload: CleanupMediaJob };

export const mediaQueue = new Queue<MediaJobData>('media', {
  prefix: 'cinetrack',
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  },
});

export const addProcessPosterJob = (payload: ProcessPosterJob) =>
  mediaQueue.add('process-poster', { type: 'process-poster', payload });

export const addProcessVideoJob = (payload: ProcessVideoJob) =>
  mediaQueue.add('process-video', { type: 'process-video', payload }, { priority: 1 });

export const addCleanupMediaJob = (payload: CleanupMediaJob) =>
  mediaQueue.add('cleanup-old-media', { type: 'cleanup-old-media', payload });
