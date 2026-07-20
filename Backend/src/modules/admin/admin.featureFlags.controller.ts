import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import FeatureFlag from '../../models/featureFlag.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';
import { logAdminAction } from '../../utils/logAdminAction.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActor = (req: Request) => ({ id: (req as any).user?.userId ?? '', name: (req as any).user?.name ?? 'Admin' });

// ─── GET /api/v1/admin/feature-flags ──────────────────────────────────────────
// List all feature flags (admin panel)
export const listFlags = catchAsync(async (_req: Request, res: Response) => {
  const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
  sendSuccess(res, flags, 'Feature flags');
});

// ─── POST /api/v1/admin/feature-flags ─────────────────────────────────────────
// Create a new feature flag
export const createFlag = catchAsync(async (req: Request, res: Response) => {
  const { key, name, description } = req.body as { key: string; name: string; description?: string };
  const actor = getActor(req);

  if (!key || !name) throw new AppError('key and name are required', 400);

  const existing = await FeatureFlag.findOne({ key: key.toLowerCase() });
  if (existing) throw new AppError(`Flag with key "${key}" already exists`, 409, 'DUPLICATE_FLAG');

  const flag = await FeatureFlag.create({
    key:          key.toLowerCase().trim().replace(/\s+/g, '_'),
    name,
    description,
    enabled:      false,
    updatedBy:    actor.id,
    updatedByName:actor.name,
  });

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: key, metadata: { created: true, enabled: false }, req,
  });

  sendCreated(res, flag, 'Feature flag created');
});

// ─── PATCH /api/v1/admin/feature-flags/:key/toggle ────────────────────────────
// Toggle a feature flag on/off instantly
export const toggleFlag = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const actor = getActor(req);

  const flag = await FeatureFlag.findOne({ key: key.toLowerCase() });
  if (!flag) throw new NotFoundError(`Feature flag "${key}"`);

  const oldValue = flag.enabled;
  flag.enabled       = !flag.enabled;
  flag.updatedBy     = actor.id as unknown as import('mongoose').Types.ObjectId;
  flag.updatedByName = actor.name;
  await flag.save();

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: key, metadata: { key, oldValue, newValue: flag.enabled }, req,
  });

  sendSuccess(res, { key: flag.key, enabled: flag.enabled }, `Flag "${key}" ${flag.enabled ? 'enabled' : 'disabled'}`);
});

// ─── PATCH /api/v1/admin/feature-flags/:key ───────────────────────────────────
// Update flag details (name, description, enabledFor list)
export const updateFlag = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const { name, description, enabledFor } = req.body as {
    name?: string;
    description?: string;
    enabledFor?: string[];
  };

  const update: Record<string, unknown> = {};
  if (name)        update['name'] = name;
  if (description !== undefined) update['description'] = description;
  if (enabledFor)  update['enabledFor'] = enabledFor;

  const flag = await FeatureFlag.findOneAndUpdate({ key: key.toLowerCase() }, update, { new: true });
  if (!flag) throw new NotFoundError(`Feature flag "${key}"`);

  sendSuccess(res, flag, 'Feature flag updated');
});

// ─── DELETE /api/v1/admin/feature-flags/:key ──────────────────────────────────
export const deleteFlag = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const actor = getActor(req);

  const flag = await FeatureFlag.findOneAndDelete({ key: key.toLowerCase() });
  if (!flag) throw new NotFoundError(`Feature flag "${key}"`);

  logAdminAction({
    adminId: actor.id, adminName: actor.name, action: 'FEATURE_FLAG_TOGGLED',
    targetName: key, metadata: { deleted: true }, req,
  });

  sendSuccess(res, null, `Feature flag "${key}" deleted`);
});

// ─── GET /api/v1/flags (PUBLIC — Consumer app) ────────────────────────────────
// Returns a simple { key: boolean } map — used by the consumer frontend on app load
// This is a PUBLIC route (no auth) — only returns enabled flags map, no internal details
export const getPublicFlags = catchAsync(async (_req: Request, res: Response) => {
  const flags = await FeatureFlag.find().select('key enabled').lean();
  const flagMap = Object.fromEntries(flags.map(f => [f.key, f.enabled]));
  sendSuccess(res, flagMap, 'Feature flags');
});
