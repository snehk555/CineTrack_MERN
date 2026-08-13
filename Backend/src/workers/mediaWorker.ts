import { Worker, Job } from 'bullmq';
import fs from 'fs';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { uploadImage } from '../utils/cloudinary.js';
import { MediaJobData } from '../queues/mediaQueue.js';
import Movie from '../models/movie.model.js';
import VideoAsset from '../models/videoAsset.model.js';
import Episode from '../models/episode.model.js';
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

      try {
        const videoAsset = await VideoAsset.findOne({ movieId: payload.movieId, type: 'Main' });
        if (!videoAsset) throw new Error('Video asset not found');

        const inputResolution = videoAsset.resolutions.find(r => r.quality === 'default');
        const inputPath = inputResolution?.url;
        
        if (!inputPath || !fs.existsSync(inputPath)) {
          throw new Error(`Video file not found at ${inputPath}`);
        }

        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'public', 'media', payload.movieId.toString());
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const m3u8Path = path.join(outputDir, 'master.m3u8');

        // Dynamically import ffmpeg
        const ffmpeg = (await import('fluent-ffmpeg')).default;
        const ffmpegStatic = (await import('ffmpeg-static')).default;
        if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .outputOptions([
              '-hls_time 10', // 10 second chunks
              '-hls_list_size 0', // Keep all chunks in the playlist
              '-c:v libx264', // Transcode to H.264 for guaranteed browser compatibility
              '-preset fast', // Faster encoding speed
              '-c:a aac'      // Transcode to AAC audio
            ])
            .output(m3u8Path)
            .on('progress', (progress) => {
              if (progress.percent) {
                const percent = Math.min(Math.round(progress.percent), 99);
                emitProgress(percent);
                job.updateProgress(percent).catch(() => {});
              }
            })
            .on('end', () => resolve(true))
            .on('error', (err) => reject(err))
            .run();
        });

        // Save HLS URL to DB
        const mediaUrl = `/media/${payload.movieId}/master.m3u8`;
        videoAsset.resolutions = [{ quality: '1080p', url: mediaUrl }];
        videoAsset.processingStatus = 'ready';
        await videoAsset.save();

        // Cleanup temp file
        fs.unlinkSync(inputPath);

        emitProgress(100);
        await job.updateProgress(100);

        try {
          emitToAdmins('video:processed', { movieId: payload.movieId, jobId: job.id, percent: 100 });
        } catch { /* ignore */ }

        logger.info(`Video processing marked ready for movie ${payload.movieId}`);
      } catch (error) {
        logger.error(`Error processing video for movie ${payload.movieId}:`, error);
        await VideoAsset.findOneAndUpdate(
          { movieId: payload.movieId, type: 'Main' }, 
          { $set: { processingStatus: 'failed' } }
        );
        throw error;
      }
      break;
    }

    case 'process-episode-video': {
      const p = payload as any; // Cast because payload type is union
      logger.info(`Episode video processing queued for series ${p.seriesId}, S${p.seasonNumber} E${p.episodeNumber}`);

      const emitProgress = (percent: number) => {
        try {
          emitToAdmins('episode-video:progress', { episodeId: p.episodeId, jobId: job.id, percent });
        } catch { /* ignore */ }
      };

      try {
        const episode = await Episode.findById(p.episodeId);
        if (!episode) throw new Error('Episode not found');

        const inputPath = p.filePath;
        
        if (!inputPath || !fs.existsSync(inputPath)) {
          throw new Error(`Video file not found at ${inputPath}`);
        }

        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'public', 'media', 'series', p.seriesId.toString(), p.seasonNumber.toString(), p.episodeNumber.toString());
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const m3u8Path = path.join(outputDir, 'master.m3u8');

        // Dynamically import ffmpeg
        const ffmpeg = (await import('fluent-ffmpeg')).default;
        const ffmpegStatic = (await import('ffmpeg-static')).default;
        if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .outputOptions([
              '-hls_time 10', 
              '-hls_list_size 0',
              '-c:v libx264',
              '-preset fast',
              '-c:a aac'
            ])
            .output(m3u8Path)
            .on('progress', (progress) => {
              if (progress.percent) {
                const percent = Math.min(Math.round(progress.percent), 99);
                emitProgress(percent);
                job.updateProgress(percent).catch(() => {});
              }
            })
            .on('end', () => resolve(true))
            .on('error', (err) => reject(err))
            .run();
        });

        // Save HLS URL to DB
        const mediaUrl = `/media/series/${p.seriesId}/${p.seasonNumber}/${p.episodeNumber}/master.m3u8`;
        episode.videoUrls.set('default', mediaUrl);
        episode.processingStatus = 'ready';
        await episode.save();

        // Cleanup temp file
        fs.unlinkSync(inputPath);

        emitProgress(100);
        await job.updateProgress(100);

        try {
          emitToAdmins('episode-video:processed', { episodeId: p.episodeId, jobId: job.id, percent: 100 });
        } catch { /* ignore */ }

        logger.info(`Video processing marked ready for episode ${p.episodeId}`);
      } catch (error) {
        logger.error(`Error processing video for episode ${p.episodeId}:`, error);
        await Episode.findByIdAndUpdate(
          p.episodeId, 
          { $set: { processingStatus: 'failed' } }
        );
        throw error;
      }
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

  if (job?.data.type === 'process-video') {
    const movieId = job.data.payload.movieId;
    await VideoAsset.findOneAndUpdate({ movieId, type: 'Main' }, { $set: { processingStatus: 'failed' } }).catch(() => null);
  } else if (job?.data.type === 'process-poster') {
    const movieId = job.data.payload.movieId;
    await Movie.findByIdAndUpdate(movieId, { $set: { processingStatus: 'failed' } }).catch(() => null);
  }
});

mediaWorker.on('progress', (job, progress) => {
  logger.info(`Media job ${job.id} progress: ${progress}%`);
});
