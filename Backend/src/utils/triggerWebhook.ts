import crypto from 'crypto';
import { logger } from './logger.js';
import Webhook, { WebhookEvent } from '../models/webhook.model.js';

const MAX_FAILURES = 5;
const TIMEOUT_MS   = 5000; // 5 second timeout per webhook call

/**
 * Fire-and-forget webhook dispatcher.
 * Finds all active webhooks subscribed to `event`, POSTs to each URL
 * with HMAC-SHA256 signature header. Auto-disables webhooks after 5 failures.
 *
 * Usage (in service layer — always fire-and-forget):
 *   triggerWebhook('USER_BANNED', { userId, email, reason }).catch(() => null);
 */
export const triggerWebhook = async (
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> => {
  let webhooks;
  try {
    webhooks = await Webhook.find({ events: event, isActive: true }).select('+secret').lean();
  } catch {
    logger.error(`[Webhook] Failed to query webhooks for event: ${event}`);
    return;
  }

  if (!webhooks.length) return;

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    payload,
  });

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      // HMAC-SHA256 signature so receiver can verify authenticity
      const signature = crypto
        .createHmac('sha256', wh.secret)
        .update(body)
        .digest('hex');

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(wh.url, {
          method:  'POST',
          headers: {
            'Content-Type':          'application/json',
            'X-CineTrack-Event':     event,
            'X-CineTrack-Signature': `sha256=${signature}`,
            'X-CineTrack-Timestamp': new Date().toISOString(),
          },
          body,
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Success — reset failure count + update lastTriggered
        await Webhook.findByIdAndUpdate(wh._id, {
          failureCount: 0,
          lastTriggered: new Date(),
        });

        logger.info(`[Webhook] ✅ ${event} → ${wh.url}`);
      } catch (err: unknown) {
        const newFailureCount = (wh.failureCount ?? 0) + 1;
        const shouldDisable   = newFailureCount >= MAX_FAILURES;

        await Webhook.findByIdAndUpdate(wh._id, {
          failureCount: newFailureCount,
          ...(shouldDisable ? { isActive: false } : {}),
        });

        logger.warn(
          `[Webhook] ❌ ${event} → ${wh.url} | Failures: ${newFailureCount}${shouldDisable ? ' — AUTO-DISABLED' : ''} | ${(err as Error).message}`
        );
      }
    })
  );
};
