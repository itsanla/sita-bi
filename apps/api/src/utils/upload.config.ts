import * as path from 'path';
import * as fs from 'fs';

export interface UploadConfig {
  uploadsDir: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export const uploadConfig: UploadConfig = {
  uploadsDir: process.env['UPLOADS_DIR'] ?? 'uploads',
  maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] ?? '5242880', 10), // 5MB default
  allowedFileTypes: process.env['ALLOWED_FILE_TYPES']?.split(',') ?? [
    'jpeg',
    'jpg',
    'png',
    'gif',
    'pdf',
    'doc',
    'docx',
  ],
};

// Utility function untuk mendapatkan apps/api root path
export const getApiRoot = (): string => {
  // Return current working directory (apps/api)
  return process.cwd();
};

// Utility function untuk membuat directory jika belum ada
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Utility function untuk mendapatkan path upload lengkap di apps/api
export const getUploadPath = (subDir?: string): string => {
  const apiRoot = getApiRoot();
  const basePath = path.join(apiRoot, uploadConfig.uploadsDir);

  if (subDir !== undefined && subDir.length > 0) {
    const fullPath = path.join(basePath, subDir);
    ensureDirectoryExists(fullPath);
    return fullPath;
  }
  ensureDirectoryExists(basePath);
  return basePath;
};

// Utility function untuk generate unique filename
export const generateFileName = (
  originalName: string,
  prefix?: string,
): string => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = path.extname(originalName);
  const baseName = prefix ?? 'file';

  return `${baseName}-${timestamp}-${random}${extension}`;
};

// Utility function untuk mendapatkan relative path untuk database (dari apps/api)
export const getRelativePath = (fullPath: string): string => {
  const apiRoot = getApiRoot();
  return fullPath.replace(apiRoot, '').replace(/\\/g, '/');
};

// Utility function untuk mendapatkan URL akses file
export const getFileUrl = (relativePath: string): string => {
  // Remove leading slash if exists and ensure it starts with uploads
  const cleanPath = relativePath.replace(/^\//, '');
  return `/${cleanPath}`;
};

// Utility function untuk mendapatkan absolute path dari relative path
export const getAbsolutePath = (relativePath: string): string => {
  const apiRoot = getApiRoot();
  return path.join(apiRoot, relativePath.replace(/^\//, ''));
};
