import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/x-matroska', 'video/avi'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;
const TEMP_VIDEO_DIR = '/tmp/cinetrack_uploads';

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`, 400, 'INVALID_FILE_TYPE'));
  }
};

const videoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`, 400, 'INVALID_FILE_TYPE'));
  }
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFilter,
});

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(TEMP_VIDEO_DIR)) {
      fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });
    }
    cb(null, TEMP_VIDEO_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadVideo = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: videoFilter,
});
