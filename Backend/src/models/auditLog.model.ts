import mongoose, { Schema, Document } from 'mongoose';

export type AuditAction =
  | 'USER_BANNED' | 'USER_SUSPENDED' | 'USER_PROMOTED'
  | 'USER_ROLE_CHANGED' | 'USER_PLAN_CHANGED' | 'USER_IMPERSONATED'
  | 'USER_DATA_EXPORTED'
  | 'MOVIE_PUBLISHED' | 'MOVIE_DELETED' | 'MOVIE_SCHEDULED_PUBLISHED'
  | 'REVIEW_APPROVED' | 'REVIEW_REJECTED' | 'REVIEW_DELETED'
  | 'GENRE_CREATED' | 'GENRE_UPDATED' | 'GENRE_DELETED'
  | 'FEATURE_FLAG_TOGGLED' | 'PLAN_PRICE_CHANGED'
  | 'ADMIN_LOGIN' | 'ADMIN_LOGIN_FAILED' | 'ADMIN_LOGOUT';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  action: AuditAction;
  targetId?: mongoose.Types.ObjectId;
  targetType?: 'User' | 'Movie' | 'Review' | 'Genre' | 'FeatureFlag' | 'Plan';
  targetName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminName:  { type: String, required: true },
    action:     { type: String, required: true, index: true },
    targetId:   { type: Schema.Types.ObjectId },
    targetType: { type: String, enum: ['User', 'Movie', 'Review', 'Genre', 'FeatureFlag', 'Plan'] },
    targetName: { type: String },
    metadata:   { type: Schema.Types.Mixed },
    ipAddress:  { type: String },
    userAgent:  { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
    toJSON: { virtuals: true },
  }
);

// Indexes for common queries
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
