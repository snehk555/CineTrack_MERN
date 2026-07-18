import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  meta?: PaginationMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: unknown
): Response => {
  return res.status(statusCode).json({ success: false, message, errors });
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
