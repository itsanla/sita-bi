/**
 * Komponen Unauthorized (401)
 * Digunakan untuk menampilkan halaman akses ditolak ketika user tidak memiliki izin
 *
 * Contoh penggunaan:
 * ```tsx
 * <Unauthorized message="Dashboard ini hanya untuk dosen." />
 * <Unauthorized message="Anda tidak memiliki akses ke fitur ini." showBackButton={false} />
 * ```
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

interface UnauthorizedProps {
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function Unauthorized({
  message = 'Anda tidak memiliki izin untuk mengakses halaman ini.',
  showBackButton = true,
  showHomeButton = true,
}: UnauthorizedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-8 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-100/50">
              <ShieldAlert className="w-12 h-12 text-red-600" strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full"></div>
          </div>

          <h1 className="text-6xl font-bold text-red-600 mb-2">401</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!!showBackButton && (
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 active:scale-95 hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                Kembali
              </button>
            )}
            {!!showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-red-500/30"
              >
                <Home className="w-4 h-4" strokeWidth={2} />
                Ke Beranda
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Butuh bantuan?{' '}
            <Link
              href="/dashboard"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Hubungi Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
