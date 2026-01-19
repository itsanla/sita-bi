import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

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

// Async utility function untuk membuat directory jika belum ada
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  // fs.mkdir with recursive:true is idempotent - no error if already exists
  await fsPromises.mkdir(dirPath, { recursive: true });
};

// Utility function untuk mendapatkan path upload lengkap di apps/api
// NOTE: Sync version for module-level initialization (runs once at startup)
export const getUploadPath = (subDir?: string): string => {
  const apiRoot = getApiRoot();
  // If uploadsDir is absolute path, use it directly, otherwise join with apiRoot
  const basePath = path.isAbsolute(uploadConfig.uploadsDir)
    ? uploadConfig.uploadsDir
    : path.join(apiRoot, uploadConfig.uploadsDir);

  if (subDir !== undefined && subDir.length > 0) {
    const fullPath = path.join(basePath, subDir);
    // Sync for startup init - acceptable as this runs once
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
};

// Async version for runtime use in request handlers
export const getUploadPathAsync = async (subDir?: string): Promise<string> => {
  const apiRoot = getApiRoot();
  const basePath = path.isAbsolute(uploadConfig.uploadsDir)
    ? uploadConfig.uploadsDir
    : path.join(apiRoot, uploadConfig.uploadsDir);

  if (subDir !== undefined && subDir.length > 0) {
    const fullPath = path.join(basePath, subDir);
    await ensureDirectoryExists(fullPath);
    return fullPath;
  }
  await ensureDirectoryExists(basePath);
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
