'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import request from '@/lib/api';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'waiting' | 'verifying' | 'success' | 'failed'>('waiting');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('waiting');
      return;
    }

    setStatus('verifying');
    const verifyToken = async () => {
      try {
        await request<{ message: string }>('/auth/verify-email', {
          method: 'POST',
          data: { token },
        });
        setStatus('success');
        setError('');
      } catch (err) {
        const error = err as { data?: { message?: string }; message?: string };
        setStatus('failed');
        const errorMessage = error.data?.message || error.message || 'Terjadi kesalahan.';
        setError(errorMessage);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {status === 'waiting' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cek Email Anda</h1>
            <p className="text-gray-600 mb-4">
              Kami telah mengirim link verifikasi ke{' '}
              <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Silakan cek inbox atau folder spam Anda dan klik link verifikasi untuk mengaktifkan akun.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Kembali ke Login
            </button>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Memverifikasi Email</h1>
            <p className="text-gray-600">Mohon tunggu sebentar...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Berhasil!</h1>
            <p className="text-gray-600 mb-6">Email Anda telah berhasil diverifikasi.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Lanjut ke Login
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Gagal</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600 mb-6">Silakan coba registrasi ulang atau hubungi admin.</p>
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Kembali ke Registrasi
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyComponent />
    </Suspense>
  );
}
