import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { movieRepository } from '../modules/movies/movie.repository.js';
import { redis } from '../config/redis.js';
import { addWeeklyDigestJob } from '../queues/emailQueue.js';
import { addCleanupMediaJob } from '../queues/mediaQueue.js';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';

export const startScheduledJobs = () => {
  // Every hour — recalculate trending movies and update Redis cache
  cron.schedule('0 * * * *', async () => {
    try {
      const trending = await movieRepository.getTrending(10);
      await redis.setex('cache:movies:trending', 3600, JSON.stringify(trending));
      logger.info('Scheduled job: trending movies cache refreshed');
    } catch (err) {
      logger.error('Scheduled job failed: trending refresh', { err });
    }
  });

  // Every day at midnight — expire subscriptions
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await Subscription.updateMany(
        { status: 'active', endDate: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      );
      logger.info(`Scheduled job: ${result.modifiedCount} subscriptions expired`);
    } catch (err) {
      logger.error('Scheduled job failed: subscription expiry', { err });
    }
  });

  // Every Sunday at 8am IST (UTC+5:30 = 2:30am UTC)
  cron.schedule('30 2 * * 0', async () => {
    try {
      const users = await User.find({ isActive: true }).select('_id').lean();
      const userIds = users.map((u) => u._id.toString());

      await addWeeklyDigestJob({
        userIds,
        weekOf: new Date().toISOString().split('T')[0],
      });

      logger.info(`Scheduled job: weekly digest queued for ${userIds.length} users`);
    } catch (err) {
      logger.error('Scheduled job failed: weekly digest', { err });
    }
  });

  // Every week on Monday at 3am UTC — cleanup old Cloudinary media
  cron.schedule('0 3 * * 1', async () => {
    try {
      await addCleanupMediaJob({ olderThanDays: 30 });
      logger.info('Scheduled job: media cleanup job queued');
    } catch (err) {
      logger.error('Scheduled job failed: media cleanup', { err });
    }
  });

  logger.info('Scheduled jobs registered');
};
