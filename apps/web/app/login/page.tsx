'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<{
        userId: number;
        user: {
          id: number;
          name: string;
          email: string;
          roles: Array<{ name: string }>;
        };
      }>('/auth/login', { identifier, password });

      const userId = response.data?.data?.userId;
      const user = response.data?.data?.user;

      if (userId && user) {
        const token = String(userId);
        localStorage.setItem('token', token);

        // Redirect based on role
        const userRole = user.roles[0]?.name;

        if (userRole === 'kajur' || userRole === 'kaprodi_d3' || userRole === 'kaprodi_d4' || userRole === 'admin') {
          router.push('/dashboard/admin');
        } else if (userRole === 'dosen') {
          router.push('/dashboard/dosen');
        } else if (userRole === 'mahasiswa') {
          router.push('/dashboard/mahasiswa');
        } else {
          router.push('/dashboard/mahasiswa');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan saat login';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-rose-600 via-red-700 to-amber-600 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Selamat Datang
              </h1>
              <p className="text-white/90 text-sm">
                Masuk untuk melanjutkan ke SITA-BI
              </p>
            </div>
          </div>

          {/* Form section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email/Username input */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="identifier"
                >
                  Email atau Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>

              {/* Error message */}
              {!!error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Masuk...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Belum punya akun?
                </span>
              </div>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl border-2 border-rose-600 text-rose-600 font-semibold hover:bg-rose-50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Buat Akun Baru
              </Link>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi
          kami.
        </p>
      </div>
    </div>
  );
}
