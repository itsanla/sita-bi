'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Password tidak sama');
      return;
    }

    if (!token) {
      toast.error('Token tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, newPassword }),
        },
      );

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      toast.success(data.message || 'Password berhasil diubah. Silakan login.');
      router.push('/login');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500">Token reset password tidak ditemukan.</p>
        <Link
          href="/forgot-password"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Kirim ulang link
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="-space-y-px rounded-md shadow-sm">
        <div>
          <label htmlFor="new-password" className="sr-only">
            Password Baru
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Password Baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="sr-only">
            Konfirmasi Password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isLoading ? 'Mengubah...' : 'Ubah Password'}
        </button>
      </div>
      <div className="text-center">
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Kembali ke Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan password baru Anda.
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
