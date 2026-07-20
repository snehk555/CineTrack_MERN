import mongoose, { Schema, Document } from 'mongoose';

export type WebhookEvent =
  | 'USER_REGISTERED' | 'USER_BANNED' | 'USER_UPGRADED'
  | 'MOVIE_PUBLISHED' | 'MOVIE_DELETED'
  | 'REVIEW_APPROVED' | 'REVIEW_REJECTED';

export interface IWebhook extends Document {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;       // HMAC-SHA256 signing secret (shown once on creation)
  isActive: boolean;
  lastTriggered?: Date;
  failureCount: number; // auto-disables after 5 consecutive failures
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    name:          { type: String, required: true, trim: true },
    url:           { type: String, required: true, trim: true },
    events:        [{ type: String, enum: ['USER_REGISTERED','USER_BANNED','USER_UPGRADED','MOVIE_PUBLISHED','MOVIE_DELETED','REVIEW_APPROVED','REVIEW_REJECTED'] }],
    secret:        { type: String, required: true, select: false }, // hidden by default
    isActive:      { type: Boolean, default: true },
    lastTriggered: { type: Date },
    failureCount:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

webhookSchema.index({ events: 1, isActive: 1 });

export default mongoose.model<IWebhook>('Webhook', webhookSchema);
