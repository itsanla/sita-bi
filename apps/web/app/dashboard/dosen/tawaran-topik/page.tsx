'use client';
import PeriodeGuard from '@/components/shared/PeriodeGuard';

import { useEffect, useState, FormEvent } from 'react';
import request from '@/lib/api';
import { usePeriodeStatus } from '@/hooks/usePeriodeStatus';
import {
  PlusCircle,
  Loader,
  Info,
  BookOpen,
  Search,
  AlertTriangle,
} from 'lucide-react';

// --- Interfaces ---
interface TawaranTopik {
  id: number;
  judul_topik: string;
  deskripsi: string;
  kuota: number;
  dosenPencetus?: {
    name: string;
    email: string;
  };
  tugasAkhir?: Array<{
    mahasiswa: {
      user: {
        name: string;
        email: string;
      };
    };
  }>;
}

interface SimilarityResult {
  id: number;
  judul: string;
  similarity: number;
}

// --- Child Components ---
function CreateTopikForm({ onTopicCreated }: { onTopicCreated: () => void }) {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [similarityResults, setSimilarityResults] = useState<
    SimilarityResult[] | null
  >(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleCheckSimilarity = async (e: FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul topik tidak boleh kosong');
      return;
    }
    setError('');
    setChecking(true);
    setSimilarityResults(null);
    setIsBlocked(false);
    try {
      const response = await request<{
        data: { results: SimilarityResult[]; isBlocked: boolean };
      }>('/tawaran-topik/check-similarity', {
        method: 'POST',
        data: { judul_topik: judul },
      });
      setSimilarityResults(response.data.data.results || []);
      setIsBlocked(response.data.data.isBlocked || false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memeriksa kemiripan',
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!judul.trim()) {
      alert('Judul topik tidak boleh kosong');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await request('/tawaran-topik', {
        method: 'POST',
        data: { judul_topik: judul, deskripsi },
      });
      alert('Topik berhasil dibuat!');
      setJudul('');
      setDeskripsi('');
      setSimilarityResults(null);
      setIsBlocked(false);
      onTopicCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat topik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PeriodeGuard>
      <div className="space-y-4">
        {!!error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>
        )}

        <form onSubmit={handleCheckSimilarity} className="space-y-4">
          <div>
            <label
              htmlFor="judul_topik"
              className="block text-sm font-medium text-gray-700"
            >
              Judul Topik
            </label>
            <textarea
              id="judul_topik"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              placeholder="Masukkan judul topik yang akan ditawarkan..."
              required
            />
          </div>
          <div>
            <label
              htmlFor="deskripsi"
              className="block text-sm font-medium text-gray-700"
            >
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={checking || !judul.trim()}
            className="w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {checking ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <Search className="mr-2" size={16} />
            )}
            {checking ? 'Memeriksa Kemiripan...' : 'Periksa Kemiripan Judul'}
          </button>
        </form>

        {similarityResults !== null && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-800">
              Hasil Pemeriksaan Kemiripan
            </h3>
            {similarityResults.length > 0 ? (
              <div className="space-y-2">
                {similarityResults.map((result) => {
                  let bgClass = 'bg-green-50 border-green-200';
                  let badgeClass = 'bg-green-600 text-white';
                  if (result.similarity >= 80) {
                    bgClass = 'bg-red-50 border-red-200';
                    badgeClass = 'bg-red-600 text-white';
                  } else if (result.similarity >= 50) {
                    bgClass = 'bg-yellow-50 border-yellow-200';
                    badgeClass = 'bg-yellow-600 text-white';
                  }
                  return (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {result.judul}
                          </p>
                        </div>
                        <span
                          className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
                        >
                          {result.similarity}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Tidak ditemukan kemiripan signifikan. Judul Anda unik!
                </p>
              </div>
            )}

            {!!isBlocked && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">
                    Pengajuan Diblokir
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    Judul memiliki kemiripan 80% atau lebih dengan judul yang
                    sudah ada. Silakan ubah judul Anda.
                  </p>
                </div>
              </div>
            )}

            {!isBlocked && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 disabled:bg-gray-400"
              >
                {!!submitting && (
                  <Loader className="animate-spin mr-2" size={16} />
                )}
                {submitting ? 'Membuat Topik...' : 'Buat Topik'}
              </button>
            )}
          </div>
        )}
      </div>
    </PeriodeGuard>
  );
}

// --- Main Page Component ---
export default function TawaranTopikPage() {
  const { status: periodeStatus, loading: periodeLoading } = usePeriodeStatus();
  const [topics, setTopics] = useState<TawaranTopik[]>([]);
  const [allTopics, setAllTopics] = useState<TawaranTopik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsRes, allTopicsRes] = await Promise.all([
        request<{ data: { data: TawaranTopik[] } }>('/tawaran-topik'),
        request<{ data: { data: TawaranTopik[] } }>('/tawaran-topik/all'),
      ]);
      const topicsData = topicsRes.data.data?.data || topicsRes.data.data;
      const allTopicsData =
        allTopicsRes.data.data?.data || allTopicsRes.data.data;

      if (Array.isArray(topicsData)) {
        setTopics(topicsData);
      }
      if (Array.isArray(allTopicsData)) {
        setAllTopics(allTopicsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!periodeLoading && periodeStatus?.isActive) {
      fetchData();
    } else if (!periodeLoading) {
      setLoading(false);
    }
  }, [periodeLoading, periodeStatus?.isActive]);

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <PeriodeGuard>
      <div className="space-y-8">
        {/* Header and Create Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Tawaran Topik</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 transition"
          >
            <PlusCircle size={16} className="mr-2" />
            {showCreateForm ? 'Tutup Form' : 'Buat Topik Baru'}
          </button>
        </div>

        {/* Create Form Section */}
        {showCreateForm ? (
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Formulir Topik Baru
            </h2>
            <CreateTopikForm
              onTopicCreated={() => {
                fetchData();
                setShowCreateForm(false);
              }}
            />
          </div>
        ) : null}

        {/* My Topics Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <BookOpen size={24} className="mr-3 text-maroon-700" /> Topik yang
            Saya Tawarkan
          </h2>
          {!!loading && (
            <div className="flex items-center justify-center p-6">
              <Loader className="animate-spin text-maroon-700" size={24} />
            </div>
          )}
          {!loading && topics.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              <Info size={32} className="mx-auto mb-2" />
              <p>Anda belum menawarkan topik apapun.</p>
            </div>
          )}
          {!loading && topics.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judul Topik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topics.map((topic) => (
                    <tr key={topic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {topic.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {topic.judul_topik}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                        {topic.deskripsi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Topics Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <BookOpen size={24} className="mr-3 text-maroon-700" /> Semua
            Tawaran Topik
          </h2>
          {!!loading && (
            <div className="flex items-center justify-center p-6">
              <Loader className="animate-spin text-maroon-700" size={24} />
            </div>
          )}
          {!loading && allTopics.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              <Info size={32} className="mx-auto mb-2" />
              <p>Belum ada tawaran topik yang tersedia.</p>
            </div>
          )}
          {!loading && allTopics.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judul Topik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dosen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diambil Oleh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allTopics.map((topic) => (
                    <tr key={topic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {topic.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {topic.judul_topik}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                        {topic.deskripsi}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {topic.dosenPencetus?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {!!topic.tugasAkhir && topic.tugasAkhir.length > 0
                          ? topic.tugasAkhir[0].mahasiswa.user.name
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PeriodeGuard>
  );
}
