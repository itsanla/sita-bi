// apps/web/app/admin/import/components/PreviewStep.tsx
'use client';

import React from 'react';
import { ValidationResult, ImportResult } from '../types';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { UseMutationResult } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

interface PreviewStepProps {
  validationResult: ValidationResult;
  executeMutation: UseMutationResult<
    AxiosResponse<ApiResponse<ImportResult>>,
    Error,
    FormData
  >;
  onCancel: () => void;
  file: File | null;
}

export default function PreviewStep({
  validationResult,
  executeMutation,
  onCancel,
  file,
}: PreviewStepProps) {
  const handleExecute = () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      executeMutation.mutate(formData);
    }
  };

  const hasErrors = validationResult.errors.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Langkah 2: Pratinjau Validasi
      </h2>
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
          <CheckCircle size={16} />
          <span>Valid: {validationResult.valid}</span>
        </div>
        <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
          <AlertTriangle size={16} />
          <span>Invalid: {validationResult.invalid}</span>
        </div>
      </div>

      {hasErrors ? (
        <div className="mb-6 max-h-60 overflow-y-auto border p-4 rounded-md bg-red-50">
          <h3 className="font-bold text-red-800 mb-2">Detail Kesalahan:</h3>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            {validationResult.errors.map((err, idx) => (
              <li key={idx}>
                <strong>Baris {err.row}:</strong> {err.messages.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-md bg-green-50 text-green-800 text-sm">
          Semua data valid dan siap untuk diimpor.
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button
          onClick={handleExecute}
          disabled={executeMutation.isPending || validationResult.valid === 0}
          className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {executeMutation.isPending
            ? 'Mengimpor...'
            : `Impor ${validationResult.valid} Data`}
        </button>
      </div>
    </div>
  );
}
