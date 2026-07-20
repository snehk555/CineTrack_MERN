import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from './logger.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface UploadResult {
  url: string;
  publicId: string;
}

const uploadFromBuffer = (
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, ...options },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

export const uploadImage = async (
  buffer: Buffer,
  folder: string,
  publicId?: string,
  customOptions?: Record<string, unknown>
): Promise<UploadResult> => {
  const options: Record<string, unknown> = {
    resource_type: 'image',
    quality: 'auto',
    format: 'webp',
    width: 500,
    crop: 'limit',
    ...customOptions,
  };
  if (publicId) options.public_id = publicId;

  logger.info(`Uploading image to Cloudinary — folder: ${folder}`);
  return uploadFromBuffer(buffer, folder, options);
};

export const uploadBackdrop = async (buffer: Buffer): Promise<UploadResult> => {
  logger.info('Uploading backdrop to Cloudinary');
  return uploadFromBuffer(buffer, 'cinetrack/backdrops', {
    resource_type: 'image',
    quality: 'auto',
    format: 'webp',
    width: 1280,
    crop: 'limit',
  });
};

export const uploadAvatar = async (buffer: Buffer, userId: string): Promise<UploadResult> => {
  return uploadFromBuffer(buffer, 'cinetrack/avatars', {
    resource_type: 'image',
    quality: 'auto',
    format: 'webp',
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    public_id: `avatar-${userId}`,
    overwrite: true,
  });
};

export const deleteMedia = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  logger.info(`Cloudinary media deleted: ${publicId}`);
};

export const generateThumbnail = (videoPublicId: string, timeOffset = '0'): string => {
  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    format: 'jpg',
    start_offset: timeOffset,
    width: 640,
    height: 360,
    crop: 'fill',
  });
};
