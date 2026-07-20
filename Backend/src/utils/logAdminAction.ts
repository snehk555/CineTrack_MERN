import { Request } from 'express';
import AuditLog, { AuditAction } from '../models/auditLog.model.js';
import mongoose from 'mongoose';

interface LogPayload {
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId?: string;
  targetType?: 'User' | 'Movie' | 'Review' | 'Genre' | 'FeatureFlag' | 'Plan';
  targetName?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

// ─── Fire-and-forget audit logger ─────────────────────────────────────────
// Never awaited in the main request flow. A failure here must NOT break the action.
export const logAdminAction = (payload: LogPayload): void => {
  AuditLog.create({
    adminId:    new mongoose.Types.ObjectId(payload.adminId),
    adminName:  payload.adminName,
    action:     payload.action,
    targetId:   payload.targetId ? new mongoose.Types.ObjectId(payload.targetId) : undefined,
    targetType: payload.targetType,
    targetName: payload.targetName,
    metadata:   payload.metadata,
    ipAddress:  payload.req?.ip ?? payload.req?.socket.remoteAddress,
    userAgent:  payload.req?.get('User-Agent'),
  }).catch((err) => {
    // Log to stderr but never crash the app
    console.error('[AuditLog] Failed to write audit log:', err?.message);
  });
};
