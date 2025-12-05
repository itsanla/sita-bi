/**
 * Komponen NotFound (404)
 * Digunakan untuk menampilkan halaman tidak ditemukan
 *
 * Contoh penggunaan:
 * ```tsx
 * <NotFound />
 * <NotFound message="Fitur ini belum tersedia." />
 * <NotFound showBackButton={false} showHomeButton={true} />
 * ```
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';

interface NotFoundProps {
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function NotFound({
  message = 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.',
  showBackButton = true,
  showHomeButton = true,
}: NotFoundProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-100/50">
              <FileQuestion
                className="w-12 h-12 text-blue-600"
                strokeWidth={2}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Search className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-blue-600 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Halaman Tidak Ditemukan
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <Home className="w-4 h-4" strokeWidth={2} />
                Ke Beranda
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Atau kembali ke{' '}
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
