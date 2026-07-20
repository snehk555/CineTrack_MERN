import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync.js';
import { uploadImage } from '../../utils/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const type = req.query.type as string;
  const folder = 'cinetrack/uploads';
  
  const customOptions: Record<string, unknown> = {};
  if (type === 'banner' || type === 'screenshot') {
    customOptions.width = 1280;
  } else if (type === 'poster') {
    customOptions.width = 500;
  } else {
    customOptions.width = 1280; // Safe default
  }

  // Upload buffer to Cloudinary directly
  const result = await uploadImage(req.file.buffer, folder, undefined, customOptions);

  sendSuccess(res, { url: result.url, publicId: result.publicId }, 'File uploaded successfully');
});
