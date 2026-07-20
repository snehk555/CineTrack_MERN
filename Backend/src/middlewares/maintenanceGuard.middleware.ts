import { Request, Response, NextFunction } from 'express';
import AppSettings from '../models/appSettings.model.js';

/**
 * Maintenance mode middleware.
 * If maintenanceMode is true in AppSettings, all non-admin users get 503.
 * Admin users (role: admin | super_admin) are NOT blocked.
 *
 * Mount BEFORE all user-facing routes in app.ts:
 *   app.use('/api/v1', maintenanceGuard, userRoutes);
 */
export const maintenanceGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await AppSettings.findOne().select('maintenanceMode maintenanceMessage').lean();

    if (!settings?.maintenanceMode) {
      return next(); // maintenance off — pass through
    }

    // Allow admin / super_admin to bypass maintenance mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (req as any).user?.role as string | undefined;
    if (role === 'admin' || role === 'super_admin') {
      return next();
    }

    res.status(503).json({
      success: false,
      code:    'MAINTENANCE_MODE',
      message: settings.maintenanceMessage ?? "We're upgrading our servers. Back soon!",
    });
  } catch {
    // If DB is down, let the request through — don't block everything
    next();
  }
};
