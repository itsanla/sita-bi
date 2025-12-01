'use client';

import { useEffect, useState } from 'react';

interface FileData {
  id: number;
  original_name: string;
  filename: string;
  path: string;
  mime_type: string;
  size: number;
  created_at: string;
  url: string;
}

export default function FileList() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files`,
      );
      if (response.ok) {
        const data = await response.json();
        setFiles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []); // Run once on mount

  // Allow parent/siblings to trigger refresh if needed via context or props in a real app
  // For now, we rely on the user refreshing or simple periodic check if needed

  if (loading) return <div>Memuat daftar file...</div>;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Daftar File</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Nama File</th>
              <th className="py-2 px-4 border-b text-left">Tipe</th>
              <th className="py-2 px-4 border-b text-left">Ukuran</th>
              <th className="py-2 px-4 border-b text-left">Tanggal</th>
              <th className="py-2 px-4 border-b text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td className="py-2 px-4 border-b">{file.original_name}</td>
                <td className="py-2 px-4 border-b">{file.mime_type}</td>
                <td className="py-2 px-4 border-b">
                  {(file.size / 1024).toFixed(2)} KB
                </td>
                <td className="py-2 px-4 border-b">
                  {new Date(file.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Lihat
                  </a>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/download/${file.path.split('/').pop()}`}
                    className="text-green-600 hover:underline"
                  >
                    Unduh
                  </a>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  Belum ada file yang diunggah.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
