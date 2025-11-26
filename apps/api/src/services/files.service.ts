// import { prisma } from '@repo/db'; // Removed because prisma named export doesn't exist
// import { getRelativePath } from '../utils/upload.config'; // Removed unused import
// import type { File, User } from '@prisma/client'; // REMOVE THIS: File is not a model in schema.prisma

interface FileUploadData {
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedBy?: number;
}

interface FileRecord {
  id: number;
  original_name: string;
  filename: string;
  path: string;
  mime_type: string;
  size: number;
  uploaded_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface FileWithUploader extends FileRecord {
  uploader: Pick<User, 'email' | 'name'> | null;
}

export const create = async (_data: FileUploadData): Promise<FileRecord> => {
  // const relativePath = getRelativePath(data.path);
  // return await prisma.file.create({ ... });
  throw new Error('File model is missing in schema. Service unavailable.');
};

export const list = async (): Promise<FileWithUploader[]> => {
  return [];
};

export const getById = async (
  _id: number,
): Promise<FileWithUploader | null> => {
  return null;
};

export const deleteFile = async (): Promise<FileRecord> => {
  throw new Error('File model is missing in schema. Service unavailable.');
};
