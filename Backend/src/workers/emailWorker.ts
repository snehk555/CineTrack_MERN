import { Worker, Job } from 'bullmq';
import { Resend } from 'resend';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { EmailJobData } from '../queues/emailQueue.js';

const resend = new Resend(env.RESEND_API_KEY ?? '');

const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const processEmailJob = async (job: Job<EmailJobData>) => {
  const { type, payload } = job.data;

  switch (type) {
    case 'welcome': {
      await sendEmail(
        payload.email,
        'Welcome to CineTrack!',
        `<h1>Welcome, ${payload.name}!</h1><p>Your account has been created successfully. Start exploring movies now.</p>`
      );
      logger.info(`Welcome email sent to ${payload.email}`);
      break;
    }

    case 'password-reset': {
      await sendEmail(
        payload.email,
        'CineTrack — Password Reset OTP',
        `<h2>Password Reset</h2><p>Your OTP is: <strong>${payload.otp}</strong></p><p>This OTP expires in ${payload.expiresInMinutes} minutes.</p>`
      );
      logger.info(`Password reset email sent to ${payload.email}`);
      break;
    }

    case 'weekly-digest': {
      logger.info(`Weekly digest job started for ${payload.userIds.length} users`);
      break;
    }

    default: {
      logger.warn('Unknown email job type received');
    }
  }
};

export const emailWorker = new Worker<EmailJobData>(
  'cinetrack:emails',
  processEmailJob,
  {
    connection: redis,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job completed: ${job.id} [${job.data.type}]`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job failed: ${job?.id} [${job?.data?.type}]`, { error: err.message });
});
