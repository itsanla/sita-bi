import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import type { Request, Response } from 'express';
import { BadRequestError } from '../errors/AppError';

interface UploadConfig {
  allowedTypes: string[];
  maxSize: number;
  destination: string;
}

const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  'dokumen-ta': {
    allowedTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024,
    destination: 'uploads/dokumen-ta',
  },
  bimbingan: {
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 10 * 1024 * 1024,
    destination: 'uploads/bimbingan',
  },
  sidang: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSize: 10 * 1024 * 1024,
    destination: 'uploads/sidang',
  },
  'sidang-files': {
    allowedTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024,
    destination: 'uploads/sidang-files',
  },
};

export class UploadService {
  async generateUploadUrl(
    fileType: string,
    category: string,
  ): Promise<{ uploadUrl: string; fileId: string }> {
    const config = UPLOAD_CONFIGS[category];
    if (config === undefined) {
      throw new BadRequestError('Category tidak valid');
    }

    if (!config.allowedTypes.includes(fileType)) {
      throw new BadRequestError('Tipe file tidak diizinkan');
    }

    // NOSONAR: Using Date.now() with random for unique filename generation is safe here
    const fileId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    return {
      uploadUrl: `/api/upload/direct`,
      fileId,
    };
  }

  async handleDirectUpload(
    req: Request,
    category: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const config = UPLOAD_CONFIGS[category];
    if (config === undefined) {
      throw new BadRequestError('Category tidak valid');
    }

    const uploadDir = path.join(process.cwd(), config.destination);
    // fs.mkdir with recursive:true is idempotent - creates if not exists, no error if exists
    await fs.mkdir(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        // NOSONAR: Using Date.now() with random for unique filename generation is safe here
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    });

    const upload = multer({
      storage,
      fileFilter: (_req, file, cb) => {
        if (config.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tipe file tidak diizinkan'));
        }
      },
      limits: { fileSize: config.maxSize },
    });

    return new Promise((resolve, reject) => {
      upload.single('file')(req, {} as Response, (err: unknown) => {
        if (err instanceof multer.MulterError) {
          reject(new BadRequestError(`Upload error: ${err.message}`));
          return;
        }

        if (err !== null && err !== undefined) {
          const msg =
            typeof err === 'object' &&
              'message' in err &&
              typeof err.message === 'string'
              ? err.message
              : 'Upload error';
          reject(new BadRequestError(msg));
          return;
        }

        if (req.file === undefined) {
          reject(new BadRequestError('File tidak ditemukan'));
          return;
        }

        resolve({
          filePath: req.file.path,
          fileName: req.file.filename,
        });
      });
    });
  }
}
