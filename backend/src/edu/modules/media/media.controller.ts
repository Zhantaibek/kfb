import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ValidationError } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';

import { config } from '../../../config';

// Файлы учебного центра лежат в общей папке загрузок сайта и раздаются как /uploads/edu/…
export const uploadsDir = path.join(config.uploadsDir, 'edu');

mkdirSync(uploadsDir, { recursive: true });

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);

function isAllowedFile(file: Express.Multer.File) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (file.mimetype.startsWith('image/') && ext !== '.heic' && ext !== '.heif') return true;
  if (file.mimetype.startsWith('video/')) return true;
  if (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)) return true;
  return ALLOWED.has(file.mimetype);
}

const ALLOWED = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.heic' || ext === '.heif' || file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      cb(new Error('HEIC не поддерживается. Сохраните фото как JPG или PNG'));
      return;
    }
    if (!isAllowedFile(file)) {
      cb(new Error('Разрешены изображения (jpg, png, webp, gif) и видео (mp4, webm, mov)'));
      return;
    }
    cb(null, true);
  },
});

export const mediaController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new ValidationError('Файл не выбран');

    const kind = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const url = `/uploads/edu/${file.filename}`;

    return sendSuccess(res, {
      url,
      kind,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }),
};
