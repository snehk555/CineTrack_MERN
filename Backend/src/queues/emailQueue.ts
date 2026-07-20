import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export interface WelcomeEmailJob {
  name: string;
  email: string;
  userId: string;
}

export interface PasswordResetEmailJob {
  email: string;
  otp: string;
  expiresInMinutes: number;
}

export interface WeeklyDigestEmailJob {
  userIds: string[];
  weekOf: string;
}

export type EmailJobData =
  | { type: 'welcome'; payload: WelcomeEmailJob }
  | { type: 'password-reset'; payload: PasswordResetEmailJob }
  | { type: 'weekly-digest'; payload: WeeklyDigestEmailJob };

export const emailQueue = new Queue<EmailJobData>('emails', {
  prefix: 'cinetrack',
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const addWelcomeEmailJob = (payload: WelcomeEmailJob) =>
  emailQueue.add('welcome', { type: 'welcome', payload });

export const addPasswordResetEmailJob = (payload: PasswordResetEmailJob) =>
  emailQueue.add('password-reset', { type: 'password-reset', payload });

export const addWeeklyDigestJob = (payload: WeeklyDigestEmailJob) =>
  emailQueue.add('weekly-digest', { type: 'weekly-digest', payload });
