import mongoose, { Schema, Document } from 'mongoose';

export type ActivityEvent =
  | 'PAGE_VIEW'
  | 'MOVIE_VIEW'
  | 'WATCHLIST_ADD'
  | 'REVIEW_SUBMIT'
  | 'SEARCH'
  | 'LOGIN'
  | 'UPGRADE';

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;
  event: ActivityEvent;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const userActivitySchema = new Schema<IUserActivity>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event:    { type: String, enum: ['PAGE_VIEW', 'MOVIE_VIEW', 'WATCHLIST_ADD', 'REVIEW_SUBMIT', 'SEARCH', 'LOGIN', 'UPGRADE'], required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
  }
);

// TTL index — auto-delete activity logs after 90 days (no cron needed)
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Composite index for fast funnel & heatmap aggregations
userActivitySchema.index({ event: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, event: 1 });

export default mongoose.model<IUserActivity>('UserActivity', userActivitySchema);
