import { Worker, Job } from 'bullmq';
import fs from 'fs';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { uploadImage } from '../utils/cloudinary.js';
import { MediaJobData } from '../queues/mediaQueue.js';
import Movie from '../models/movie.model.js';
import { emitToAdmins } from '../sockets/socketHandler.js';

const processMediaJob = async (job: Job<MediaJobData>) => {
  const { type, payload } = job.data;

  switch (type) {
    case 'process-poster': {
      logger.info(`Processing poster for movie ${payload.movieId}`);

      const response = await fetch(payload.imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { url, publicId } = await uploadImage(buffer, 'cinetrack/posters', `poster-${payload.movieId}`);

      await Movie.findByIdAndUpdate(payload.movieId, {
        $set: { posterPath: url, processingStatus: 'ready' },
      });

      logger.info(`Poster uploaded for movie ${payload.movieId}: ${publicId}`);

      // Notify admins that poster processing is done
      try {
        emitToAdmins('video:processed', { movieId: payload.movieId, percent: 100 });
      } catch { /* socket may not be init in test */ }
      break;
    }

    case 'process-video': {
      logger.info(`Video processing queued for movie ${payload.movieId} — qualities: ${payload.qualities.join(', ')}`);

      const emitProgress = (percent: number) => {
        try {
          emitToAdmins('video:progress', { movieId: payload.movieId, jobId: job.id, percent });
        } catch { /* ignore */ }
      };

      emitProgress(10);
      await job.updateProgress(10);

      // Simulate processing stages — real FFmpeg goes here in production
      await new Promise((r) => setTimeout(r, 500));
      emitProgress(30);
      await job.updateProgress(30);

      await new Promise((r) => setTimeout(r, 500));
      emitProgress(60);
      await job.updateProgress(60);

      await new Promise((r) => setTimeout(r, 500));
      emitProgress(80);
      await job.updateProgress(80);

      await Movie.findByIdAndUpdate(payload.movieId, {
        $set: { processingStatus: 'ready' },
      });

      emitProgress(100);
      await job.updateProgress(100);

      // Notify admins: video fully processed
      try {
        emitToAdmins('video:processed', { movieId: payload.movieId, jobId: job.id, percent: 100 });
      } catch { /* ignore */ }

      logger.info(`Video processing marked ready for movie ${payload.movieId}`);
      break;
    }

    case 'cleanup-old-media': {
      logger.info(`Cleanup job started — files older than ${payload.olderThanDays} days`);

      const tempDir = '/tmp/cinetrack_uploads';
      if (fs.existsSync(tempDir)) {
        const cutoff = Date.now() - payload.olderThanDays * 24 * 60 * 60 * 1000;
        const files = fs.readdirSync(tempDir);

        let deletedCount = 0;
        for (const file of files) {
          const filePath = `${tempDir}/${file}`;
          const stat = fs.statSync(filePath);
          if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
        logger.info(`Cleanup complete: ${deletedCount} temp files deleted`);
      }
      break;
    }

    default: {
      logger.warn('Unknown media job type received');
    }
  }
};

export const mediaWorker = new Worker<MediaJobData>(
  'media',
  processMediaJob,
  { prefix: 'cinetrack', connection: redis, concurrency: 2 }
);

mediaWorker.on('completed', (job) => {
  logger.info(`Media job completed: ${job.id} [${job.data.type}]`);
});

mediaWorker.on('failed', async (job, err) => {
  logger.error(`Media job failed: ${job?.id} [${job?.data?.type}]`, { error: err.message });

  if (job?.data.type === 'process-video' || job?.data.type === 'process-poster') {
    const movieId = job.data.payload.movieId;
    await Movie.findByIdAndUpdate(movieId, { $set: { processingStatus: 'failed' } }).catch(() => null);
  }
});

mediaWorker.on('progress', (job, progress) => {
  logger.info(`Media job ${job.id} progress: ${progress}%`);
});
