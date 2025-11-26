// apps/web/app/admin/import/types.ts

export interface ValidationError {
  row: number;
  messages: string[];
}

export interface ValidationResult {
  valid: number;
  invalid: number;
  errors: ValidationError[];
  data: Record<string, string>[];
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: {
    row: number;
    error: string;
  }[];
}

export type ImportType = 'mahasiswa' | 'dosen';
