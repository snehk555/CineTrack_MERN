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
    
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, result.data);
    
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
    
    for (const key in req.params) {
      delete req.params[key];
    }
    Object.assign(req.params, result.data);
    
    next();
  };
};

export const mongoIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

export const mongoIdParamsSchema = z.object({
  id: mongoIdSchema,
});
