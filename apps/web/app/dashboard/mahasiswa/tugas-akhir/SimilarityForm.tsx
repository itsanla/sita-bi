'use client';

import { useState } from 'react';
import {
  Search,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
// import Button from '@/app/components/ui/Button'; // Removed unused import
import { useSimilarityCheck, useSubmitTitle } from '@/hooks/useTugasAkhir';

interface SimilarityFormProps {
  initialTitle?: string;
  onSuccess: () => void;
}

export default function SimilarityForm({
  initialTitle = '',
  onSuccess,
}: SimilarityFormProps) {
  const [judulMandiri, setJudulMandiri] = useState(initialTitle);
  const {
    similarityResults,
    isBlocked,
    threshold,
    isChecking,
    checkSimilarity,
    reset,
  } = useSimilarityCheck();
  const { submitTitle, loading: submitting } = useSubmitTitle();

  const handleCheckSimilarity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!judulMandiri.trim()) {
      alert('Please enter a title.');
      return;
    }
    try {
      await checkSimilarity(judulMandiri);
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleSubmit = async () => {
    if (!judulMandiri.trim()) {
      alert('Please enter a title.');
      return;
    }
    try {
      await submitTitle(judulMandiri, () => {
        toast.success('Judul berhasil diajukan', {
          description: 'Judul tugas akhir Anda telah dikirim untuk persetujuan pembimbing',
        });
        reset();
        onSuccess();
      });
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/30 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#123053]/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-[#123053]/10 transition-colors duration-500"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#123053]/5 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-[#123053]/10 transition-colors duration-500"></div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-[#123053]/20 rounded-xl blur-md"></div>
              <div className="relative bg-gradient-to-br from-[#123053] to-[#0d1f36] p-2.5 rounded-xl shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Ajukan Judul Sendiri
            </h2>
            <p className="text-gray-600 text-sm leading-normal">
              Masukkan judul tugas akhir Anda dan sistem akan memeriksa
              kemiripan dengan judul yang sudah ada
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckSimilarity} className="space-y-4">
          {/* Input Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="bg-[#123053]/10 p-1 rounded-lg">
                <FileCheck className="h-3.5 w-3.5 text-[#123053]" />
              </div>
              Judul Tugas Akhir
            </label>
            <div className="relative group/input">
              <textarea
                value={judulMandiri}
                onChange={(e) => setJudulMandiri(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-[#123053] focus:ring-3 focus:ring-[#123053]/10 hover:border-gray-300 transition-all duration-200 resize-none"
                placeholder="Contoh: Sistem Informasi Manajemen Tugas Akhir Berbasis Web dengan Fitur Deteksi Kemiripan Judul Menggunakan Algoritma..."
              />
              <div className="absolute right-3 bottom-3 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{judulMandiri.length} karakter</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-[#123053]/5 rounded-lg border border-[#123053]/20">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="h-3.5 w-3.5 text-[#123053]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs text-[#123053] leading-normal">
                  <span className="font-semibold">Tips:</span> Pastikan judul Anda
                  jelas, spesifik, dan menggambarkan fokus penelitian. Hindari
                  judul yang terlalu umum atau terlalu panjang.
                </p>
              </div>
            </div>
          </div>

          {/* Check Button */}
          <button
            type="submit"
            disabled={isChecking || !judulMandiri.trim()}
            className="group/btn relative w-full bg-gradient-to-r from-[#123053] to-[#0d1f36] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden text-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-0d1f36] to-[#081423] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <Search
                className={`h-4 w-4 ${isChecking ? 'animate-spin' : 'group-hover/btn:scale-110 transition-transform duration-300'}`}
              />
              <span>
                {isChecking
                  ? 'Memeriksa Kemiripan...'
                  : 'Periksa Kemiripan Judul'}
              </span>
            </div>
          </button>
        </form>
      </div>

      {/* Similarity Results */}
      {!!similarityResults && (
        <div className="relative space-y-4 p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#123053]/20 rounded-lg blur-md"></div>
              <div className="relative bg-gradient-to-br from-[#123053] to-[#0d1f36] p-2 rounded-lg shadow-md">
                <Search className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                Hasil Pemeriksaan Kemiripan
              </h3>
              <p className="text-xs text-gray-600">
                Ditemukan {similarityResults.length} judul dengan tingkat
                kemiripan
              </p>
            </div>
          </div>

          {similarityResults.length > 0 ? (
            <div className="space-y-2">
              {similarityResults.map((result, idx) => (
                <div
                  key={result.id}
                  className="group/result relative overflow-hidden bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-300"
                >
                  {/* Colored left border based on similarity */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      result.similarity >= threshold
                        ? 'bg-gradient-to-b from-red-500 to-red-600'
                        : result.similarity >= 50
                          ? 'bg-gradient-to-b from-amber-500 to-amber-600'
                          : 'bg-gradient-to-b from-green-500 to-green-600'
                    }`}
                  ></div>

                  <div className="flex items-center gap-3 p-3 pl-4">
                    {/* Number Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shadow-sm group-hover/result:scale-105 transition-transform duration-300 ${
                          result.similarity >= threshold
                            ? 'bg-red-100 text-red-700'
                            : result.similarity >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-normal line-clamp-2 group-hover/result:text-gray-900">
                        {result.judul}
                      </p>
                    </div>

                    {/* Similarity Badge */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col items-end gap-0.5">
                        <div
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm group-hover/result:scale-105 transition-transform duration-300 ${
                            result.similarity >= threshold
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              : result.similarity >= 50
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          }`}
                        >
                          {result.similarity}%
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          Kemiripan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-12 -mt-12"></div>
              <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md"></div>
                    <div className="relative bg-gradient-to-br from-blue-600 to-sky-600 p-2.5 rounded-lg shadow-md">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 text-base mb-1">
                    Pengecekan Selesai
                  </h4>
                  <p className="text-blue-800 text-sm leading-normal">
                    {threshold === 0 
                      ? 'Pengecekan kemiripan judul dinonaktifkan oleh sistem. Judul Anda dapat langsung diajukan tanpa pemeriksaan kemiripan.'
                      : 'Tidak ditemukan kemiripan signifikan dengan judul yang sudah ada. Judul Anda unik dan siap untuk diajukan ke sistem.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Warning */}
          {!!isBlocked && (
            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-300 p-4 shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl -mr-12 -mt-12"></div>
              <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-600 to-rose-600 p-2.5 rounded-lg shadow-md">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 text-base mb-2">
                    Pengajuan Diblokir
                  </h4>
                  <div className="space-y-1.5">
                    <p className="text-red-800 text-sm leading-normal">
                      Judul Anda memiliki tingkat kemiripan{' '}
                      <span className="font-bold bg-red-200 px-2 py-0.5 rounded">
                        {threshold}% atau lebih
                      </span>{' '}
                      dengan judul yang sudah ada dalam sistem.
                    </p>
                    <p className="text-red-700 text-xs leading-normal">
                      Silakan revisi judul Anda agar lebih unik dan original.
                      Pastikan judul mencerminkan keunikan penelitian Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!isBlocked && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="group/submit relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden text-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Send
                  className={`h-4 w-4 ${submitting ? 'animate-bounce' : 'group-hover/submit:translate-x-1 transition-transform duration-300'}`}
                />
                <span>
                  {submitting
                    ? 'Mengirim Pengajuan...'
                    : 'Ajukan Judul untuk Persetujuan'}
                </span>
              </div>
              {!submitting && (
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-emerald-400/50 blur-lg opacity-0 group-hover/submit:opacity-70 transition-opacity duration-500"></div>
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
