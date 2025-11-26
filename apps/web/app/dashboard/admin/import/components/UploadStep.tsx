// apps/web/app/admin/import/components/UploadStep.tsx
'use client';

import React from 'react';
import { ImportType } from '../types';
import { Download, FileUp } from 'lucide-react';
import { UseMutationResult } from '@tanstack/react-query';
import { ValidationResult } from '../types';
import { AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

interface UploadStepProps {
  setFile: (_file: File | null) => void;
  file: File | null;
  importType: ImportType;
  validateMutation: UseMutationResult<
    AxiosResponse<ApiResponse<ValidationResult>>,
    Error,
    FormData
  >;
}

export default function UploadStep({
  setFile,
  file,
  importType,
  validateMutation,
}: UploadStepProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0] || null);
    }
  };

  const downloadTemplate = () => {
    const content =
      importType === 'mahasiswa'
        ? 'nim,nama,email,prodi,kelas\n'
        : 'nip,nama,email,prodi\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${importType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleValidate = () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      validateMutation.mutate(formData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Langkah 1: Unggah File CSV
      </h2>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Unduh template untuk memastikan format yang benar.
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <Download size={16} />
          Unduh Template
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <FileUp className="mx-auto h-12 w-12 text-gray-400" />
        <label
          htmlFor="file-upload"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          Tarik file ke sini atau{' '}
          <span className="text-blue-600 cursor-pointer">pilih file</span>
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".csv"
          onChange={handleFileChange}
        />
        {file ? (
          <p className="mt-2 text-sm text-gray-500">{file.name}</p>
        ) : null}
      </div>
      <button
        onClick={handleValidate}
        disabled={!file || validateMutation.isPending}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {validateMutation.isPending ? 'Memvalidasi...' : 'Validasi & Lanjutkan'}
      </button>
    </div>
  );
}
