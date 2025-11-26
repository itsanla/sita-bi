'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/files/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setFile(null);
      router.refresh(); // Refresh page to see new list
      // Optionally trigger a callback to update list
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gagal mengunggah file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-2">Unggah File</h3>
      <div className="flex gap-2 items-center">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
          "
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? 'Mengunggah...' : 'Unggah'}
        </button>
      </div>
    </div>
  );
}
