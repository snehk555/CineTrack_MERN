import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import Episode from '../models/episode.model.js';
import Movie from '../models/movie.model.js';

/**
 * Runs every 5 minutes.
 * Checks for scheduled Episodes and Movies whose publishAt has passed
 * and updates their status to 'published'.
 */
export const startScheduledPublishCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();

    try {
      // ── Publish scheduled Episodes ─────────────────────────────────────
      const episodeResult = await Episode.updateMany(
        {
          status: 'scheduled',
          publishAt: { $lte: now },
        },
        { $set: { status: 'published' } }
      );

      if (episodeResult.modifiedCount > 0) {
        logger.info(`[Cron] Published ${episodeResult.modifiedCount} scheduled episode(s).`);
      }

      // ── Publish scheduled Movies ───────────────────────────────────────
      const movieResult = await Movie.updateMany(
        {
          status: 'scheduled',
          publishAt: { $lte: now },
        },
        { $set: { status: 'published' } }
      );

      if (movieResult.modifiedCount > 0) {
        logger.info(`[Cron] Published ${movieResult.modifiedCount} scheduled movie(s).`);
      }
    } catch (err: any) {
      logger.error('[Cron] scheduledPublishCron failed', { error: err?.message });
    }
  });

  logger.info('[Cron] scheduledPublishCron started — runs every 5 minutes.');
};
