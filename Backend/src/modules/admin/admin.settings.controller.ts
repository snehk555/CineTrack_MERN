import crypto from 'crypto';
import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import AppSettings from '../../models/appSettings.model.js';
import SubscriptionPlan from '../../models/subscriptionPlan.model.js';
import Webhook from '../../models/webhook.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActor = (req: Request) => ({ id: (req as any).user?.userId ?? '', name: (req as any).user?.name ?? 'Admin' });

// ══════════════════════════════════════════════════════
// ── APP SETTINGS ──────────────────────────────────────
// ══════════════════════════════════════════════════════

// ─── GET /api/v1/admin/settings ───────────────────────
export const getSettings = catchAsync(async (_req: Request, res: Response) => {
  // Use static helper — auto-creates singleton if not exists
  const settings = await (AppSettings as unknown as { getSettings: () => Promise<unknown> }).getSettings();
  sendSuccess(res, settings, 'App settings');
});

// ─── PATCH /api/v1/admin/settings ─────────────────────
export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);
  const allowed = [
    'maintenanceMode', 'maintenanceMessage', 'allowNewRegistrations',
    'defaultSubscriptionPlan', 'maxMoviesPerPage',
    'platformName', 'supportEmail', 'featuredMovieIds',
  ];

  const update: Record<string, unknown> = { updatedBy: actor.id };
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const settings = await AppSettings.findOneAndUpdate({}, update, {
    new: true, upsert: true, setDefaultsOnInsert: true,
  });

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: 'AppSettings', metadata: { updated: Object.keys(update) }, req,
  });

  sendSuccess(res, settings, 'Settings updated');
});

// ─── POST /api/v1/admin/settings/maintenance/on ───────
export const enableMaintenance = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { message } = req.body as { message?: string };

  const settings = await AppSettings.findOneAndUpdate(
    {},
    {
      maintenanceMode:    true,
      maintenanceMessage: message ?? "We're upgrading. Back soon!",
      updatedBy:          actor.id,
    },
    { new: true, upsert: true }
  );

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: 'maintenanceMode', metadata: { enabled: true, message }, req,
  });

  sendSuccess(res, settings, 'Maintenance mode ENABLED');
});

// ─── POST /api/v1/admin/settings/maintenance/off ──────
export const disableMaintenance = catchAsync(async (req: Request, res: Response) => {
  const actor = getActor(req);

  const settings = await AppSettings.findOneAndUpdate(
    {},
    { maintenanceMode: false, updatedBy: actor.id },
    { new: true, upsert: true }
  );

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: 'maintenanceMode', metadata: { enabled: false }, req,
  });

  sendSuccess(res, settings, 'Maintenance mode DISABLED');
});

// ══════════════════════════════════════════════════════
// ── SUBSCRIPTION PLANS ────────────────────────────────
// ══════════════════════════════════════════════════════

// ─── GET /api/v1/admin/plans ──────────────────────────
export const listPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await SubscriptionPlan.find().sort({ priceMonthly: 1 }).lean();
  sendSuccess(res, plans, 'Subscription plans');
});

// ─── GET /api/v1/plans (PUBLIC — consumer pricing page) ─
export const getPublicPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await SubscriptionPlan.find({ isActive: true })
    .select('key name priceMonthly priceYearly features')
    .sort({ priceMonthly: 1 })
    .lean();
  sendSuccess(res, plans, 'Plans');
});

// ─── PATCH /api/v1/admin/plans/:key ───────────────────
export const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const actor = getActor(req);
  const { priceMonthly, priceYearly, features, name } = req.body as {
    priceMonthly?: number; priceYearly?: number; features?: string[]; name?: string;
  };

  const plan = await SubscriptionPlan.findOne({ key: key as 'free' | 'premium' | 'pro' });
  if (!plan) throw new NotFoundError(`Plan "${key}"`);

  const oldMonthly = plan.priceMonthly;
  const update: Record<string, unknown> = { updatedBy: actor.id, updatedByName: actor.name };
  if (priceMonthly !== undefined) update['priceMonthly'] = priceMonthly;
  if (priceYearly  !== undefined) update['priceYearly']  = priceYearly;
  if (features)                   update['features']     = features;
  if (name)                       update['name']         = name;

  const updated = await SubscriptionPlan.findOneAndUpdate({ key: key as 'free' | 'premium' | 'pro' }, update, { new: true });

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'PLAN_PRICE_CHANGED',
    targetName: key,
    metadata: { key, oldPriceMonthly: oldMonthly, newPriceMonthly: priceMonthly }, req,
  });

  sendSuccess(res, updated, `Plan "${key}" updated`);
});

// ─── PATCH /api/v1/admin/plans/:key/toggle ────────────
export const togglePlan = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const plan = await SubscriptionPlan.findOne({ key: key as 'free' | 'premium' | 'pro' });
  if (!plan) throw new NotFoundError(`Plan "${key}"`);

  plan.isActive = !plan.isActive;
  await plan.save();

  sendSuccess(res, { key, isActive: plan.isActive }, `Plan "${key}" ${plan.isActive ? 'activated' : 'deactivated'}`);
});

// ══════════════════════════════════════════════════════
// ── WEBHOOKS ──────────────────────────────────────────
// ══════════════════════════════════════════════════════

// ─── GET /api/v1/admin/webhooks ───────────────────────
export const listWebhooks = catchAsync(async (_req: Request, res: Response) => {
  const webhooks = await Webhook.find().select('-secret').lean();
  sendSuccess(res, webhooks, 'Webhooks');
});

// ─── POST /api/v1/admin/webhooks ──────────────────────
export const createWebhook = catchAsync(async (req: Request, res: Response) => {
  const { name, url, events } = req.body as { name: string; url: string; events: string[] };
  if (!name || !url || !events?.length) throw new AppError('name, url and events[] are required', 400);

  // Auto-generate HMAC secret — shown ONCE in the response, never again
  const secret = crypto.randomBytes(32).toString('hex');

  const safeEvents = events as import('../../models/webhook.model.js').WebhookEvent[];

  const webhook = await Webhook.create({ name, url, events: safeEvents, secret });

  // Return secret in this response only — after this it is select:false
  const webhookObj = webhook.toObject() as unknown as Record<string, unknown>;
  sendCreated(res, { ...webhookObj, secret }, 'Webhook created. Save the secret — it will not be shown again.');
});

// ─── PATCH /api/v1/admin/webhooks/:id/toggle ──────────
export const toggleWebhook = catchAsync(async (req: Request, res: Response) => {
  const webhook = await Webhook.findById(req.params['id']);
  if (!webhook) throw new NotFoundError('Webhook');

  webhook.isActive     = !webhook.isActive;
  webhook.failureCount = 0; // reset failures on manual re-enable
  await webhook.save();

  sendSuccess(res, { isActive: webhook.isActive }, `Webhook ${webhook.isActive ? 'enabled' : 'disabled'}`);
});

// ─── POST /api/v1/admin/webhooks/:id/test ─────────────
// Sends a test payload to the webhook URL right now
export const testWebhook = catchAsync(async (req: Request, res: Response) => {
  const webhook = await Webhook.findById(req.params['id']).select('+secret');
  if (!webhook) throw new NotFoundError('Webhook');

  const { triggerWebhook } = await import('../../utils/triggerWebhook.js');
  // Send on the first subscribed event as a test
  const testEvent = webhook.events[0] ?? 'USER_REGISTERED';
  await triggerWebhook(testEvent, { test: true, webhookId: webhook.id });

  sendSuccess(res, null, `Test payload sent to ${webhook.url}`);
});

// ─── DELETE /api/v1/admin/webhooks/:id ────────────────
export const deleteWebhook = catchAsync(async (req: Request, res: Response) => {
  const webhook = await Webhook.findByIdAndDelete(req.params['id']);
  if (!webhook) throw new NotFoundError('Webhook');
  sendSuccess(res, null, 'Webhook deleted');
});
