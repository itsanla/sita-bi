// apps/web/app/admin/reports/components/ExportButton.tsx
'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => Promise<void>;
  fileType: 'PDF' | 'Excel';
  disabled?: boolean;
}

export default function ExportButton({
  onClick,
  fileType,
  disabled = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  const isPdf = fileType === 'PDF';
  const bgColor = isPdf
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-green-600 hover:bg-green-700';
  const iconColor = isPdf ? 'text-red-300' : 'text-green-300';

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${bgColor}`}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Mengekspor...</span>
        </>
      ) : (
        <>
          <FileDown size={18} className={iconColor} />
          <span>{fileType}</span>
        </>
      )}
    </button>
  );
}
