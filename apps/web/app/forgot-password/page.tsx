'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, Send, ArrowLeft } from 'lucide-react';
import request from '@/lib/api';
// import { useRouter } from 'next/navigation'; // Removed unused import

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // Removed unused variable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await request('/auth/forgot-password', {
        method: 'POST',
        data: { email },
      });
      // We don't redirect, we just show success message (handled by UI state if needed, currently just an alert)
      alert('Jika email terdaftar, link reset password akan dikirim.');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert(`Error: ${(err as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 via-red-700 to-amber-600 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Lupa Password?
              </h1>
              <p className="text-white/90 text-sm">
                Masukkan email Anda untuk mereset password
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="email"
                >
                  Email Terdaftar
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Link Reset</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
