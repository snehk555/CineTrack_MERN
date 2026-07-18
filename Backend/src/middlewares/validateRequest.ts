import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.query = result.data as Record<string, string>;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
};

export const mongoIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

export const mongoIdParamsSchema = z.object({
  id: mongoIdSchema,
});
