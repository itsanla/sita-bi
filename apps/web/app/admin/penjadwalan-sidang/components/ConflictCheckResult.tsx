// apps/web/app/admin/penjadwalan-sidang/components/ConflictCheckResult.tsx
'use client';

import React from 'react';
import { ConflictCheckResult as ConflictCheckResultType } from '../types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConflictCheckResultProps {
  conflictResult: ConflictCheckResultType | null;
  isLoading: boolean;
}

export default function ConflictCheckResult({
  conflictResult,
  isLoading,
}: ConflictCheckResultProps) {
  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-700">
        Mengecek konflik...
      </div>
    );
  }

  if (!conflictResult) {
    return null;
  }

  if (conflictResult.hasConflict) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md text-sm text-red-700">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold mb-2">Konflik Terdeteksi:</p>
            <ul className="list-disc pl-5 space-y-1">
              {conflictResult.messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-md text-sm text-green-700">
      <div className="flex items-center">
        <CheckCircle2 className="w-5 h-5 mr-3" />
        <p className="font-bold">
          Jadwal tersedia. Tidak ada konflik yang ditemukan.
        </p>
      </div>
    </div>
  );
}
