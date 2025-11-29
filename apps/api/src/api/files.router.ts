import type { Request, Response } from 'express';
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import {
  getApiRoot,
  getAbsolutePath,
  getUploadPath,
  generateFileName,
  getFileUrl,
} from '../utils/upload.config';
import * as fileService from '../services/files.service';

const router: Router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = getUploadPath();
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Endpoint untuk upload file (Single)
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        status: 'gagal',
        message: 'Tidak ada file yang diunggah',
      });
      return;
    }

    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      // uploadedBy: req.user?.id // Todo: Integrate with auth
    };

    const savedFile = await fileService.create(fileData);

    res.status(201).json({
      status: 'sukses',
      message: 'File berhasil diunggah',
      data: {
        ...savedFile,
        url: getFileUrl(savedFile.path),
      },
    });
  }),
);

// Endpoint untuk upload multiple files
router.post(
  '/upload-multiple',
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'Tidak ada file yang diunggah',
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const savedFiles = [];

    for (const file of files) {
      const fileData = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
      };
      const saved = await fileService.create(fileData);
      savedFiles.push({
        ...saved,
        url: getFileUrl(saved.path),
      });
    }

    res.status(201).json({
      status: 'sukses',
      message: 'File berhasil diunggah',
      data: savedFiles,
    });
  }),
);

// Endpoint untuk list files
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const files = await fileService.list();
    const filesWithUrls = files.map((file) => ({
      ...file,
      url: getFileUrl(file.path),
    }));

    res.json({
      status: 'sukses',
      data: filesWithUrls,
    });
  }),
);

// Endpoint untuk download file berdasarkan path
router.get(
  '/download/*',
  asyncHandler((req: Request, res: Response): void => {
    // Extract file path from URL
    const filePath = req.params[0]; // This captures everything after /download/
    const fullPath = getAbsolutePath(`uploads/${filePath}`);

    // Security check: pastikan file berada dalam uploads directory
    const apiRoot = getApiRoot();
    const uploadsDir = path.join(apiRoot, 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      res.status(403).json({
        status: 'gagal',
        message: 'Akses file tidak diizinkan',
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({
        status: 'gagal',
        message: 'File tidak ditemukan',
      });
      return;
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      res.status(400).json({
        status: 'gagal',
        message: 'Path bukan file',
      });
      return;
    }

    // Set appropriate headers
    const filename = path.basename(fullPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);

    // Stream file to response
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  }),
);

// Endpoint untuk mendapatkan informasi file
router.get(
  '/info/*',
  asyncHandler((req: Request, res: Response): void => {
    const filePath = req.params[0];
    const fullPath = getAbsolutePath(`uploads/${filePath}`);

    // Security check
    const apiRoot = getApiRoot();
    const uploadsDir = path.join(apiRoot, 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      res.status(403).json({
        status: 'gagal',
        message: 'Akses file tidak diizinkan',
      });
      return;
    }

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({
        status: 'gagal',
        message: 'File tidak ditemukan',
      });
      return;
    }

    const stats = fs.statSync(fullPath);
    const filename = path.basename(fullPath);
    const extension = path.extname(fullPath);

    res.json({
      status: 'sukses',
      data: {
        filename,
        extension,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: filePath,
        downloadUrl: `/api/files/download/${filePath}`,
        viewUrl: `/uploads/${filePath}`,
      },
    });
  }),
);

export default router;
