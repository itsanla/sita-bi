// apps/web/app/admin/import/components/ResultStep.tsx
'use client';

import React from 'react';
import { ImportResult } from '../types';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ResultStepProps {
  importResult: ImportResult;
  onReset: () => void;
}

export default function ResultStep({ importResult, onReset }: ResultStepProps) {
  const hasErrors = importResult.errors.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Hasil Impor Selesai
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-2xl font-bold text-gray-700">
            {importResult.total}
          </p>
          <p className="text-sm text-gray-500">Total Diproses</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
            <CheckCircle /> {importResult.success}
          </p>
          <p className="text-sm text-green-600">Berhasil</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-2xl font-bold text-red-700 flex items-center justify-center gap-2">
            <XCircle /> {importResult.failed}
          </p>
          <p className="text-sm text-red-600">Gagal</p>
        </div>
      </div>

      {hasErrors ? (
        <div className="mb-6 max-h-60 overflow-y-auto border p-4 rounded-md bg-red-50">
          <h3 className="font-bold text-red-800 mb-2">Detail Kegagalan:</h3>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            {importResult.errors.map((err, idx) => (
              <li key={idx}>
                <strong>Baris {err.row}:</strong> {err.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        <RefreshCw size={16} />
        Mulai Impor Baru
      </button>
    </div>
  );
}
