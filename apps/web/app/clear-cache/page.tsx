'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle } from 'lucide-react';

export default function ClearCachePage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      setCleared(true);
    }
  }, []);

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {cleared ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cache Berhasil Dibersihkan
            </h1>
            <p className="text-gray-600 mb-6">
              Semua data cache dan token telah dihapus. Silakan login kembali.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Ke Halaman Login
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Membersihkan Cache...
            </h1>
            <p className="text-gray-600">Mohon tunggu sebentar</p>
          </>
        )}
      </div>
    </div>
  );
}
