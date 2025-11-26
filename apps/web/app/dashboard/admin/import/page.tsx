// apps/web/app/admin/import/page.tsx
'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api, { handleApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ImportType, ValidationResult, ImportResult } from './types';
import UploadStep from './components/UploadStep';
import PreviewStep from './components/PreviewStep';
import ResultStep from './components/ResultStep';
import { AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

type ImportStep = 'upload' | 'preview' | 'result';

export default function ImportPage() {
  const { user } = useAuth();
  const [importType, setImportType] = useState<ImportType>('mahasiswa');
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const validateMutation = useMutation<
    AxiosResponse<ApiResponse<ValidationResult>>,
    Error,
    FormData
  >({
    mutationFn: (formData) =>
      api.post(`/import/validate/${importType}`, formData),
    onSuccess: (response) => {
      const { data } = response.data;
      setValidationResult(data);
      setStep('preview');
      toast.success('Validasi file berhasil.');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const executeMutation = useMutation<
    AxiosResponse<ApiResponse<ImportResult>>,
    Error,
    FormData
  >({
    mutationFn: (formData) =>
      api.post(`/import/execute/${importType}`, formData),
    onSuccess: (response) => {
      const { data } = response.data;
      setImportResult(data);
      setStep('result');
      toast.success('Proses impor selesai.');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const handleTypeChange = (type: ImportType) => {
    setImportType(type);
    resetState();
  };

  if (!user || !user.roles?.some((r) => r.name === 'admin')) {
    return (
      <div className="p-8 text-center text-red-500">
        Akses Ditolak. Anda harus menjadi admin.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Impor Data Massal</h1>
        <p className="text-gray-600 mt-1">
          Unggah file CSV untuk menambahkan data mahasiswa atau dosen secara
          massal.
        </p>
      </div>

      <div className="flex justify-center gap-2 p-1 bg-gray-200 rounded-lg">
        <button
          onClick={() => handleTypeChange('mahasiswa')}
          className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
            importType === 'mahasiswa'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:bg-gray-300'
          }`}
        >
          Mahasiswa
        </button>
        <button
          onClick={() => handleTypeChange('dosen')}
          className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
            importType === 'dosen'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:bg-gray-300'
          }`}
        >
          Dosen
        </button>
      </div>

      <div>
        {step === 'upload' && (
          <UploadStep
            setFile={setFile}
            file={file}
            importType={importType}
            validateMutation={validateMutation}
          />
        )}
        {step === 'preview' && validationResult ? (
          <PreviewStep
            validationResult={validationResult}
            executeMutation={executeMutation}
            onCancel={resetState}
            file={file}
          />
        ) : null}
        {step === 'result' && importResult ? (
          <ResultStep importResult={importResult} onReset={resetState} />
        ) : null}
      </div>
    </div>
  );
}
