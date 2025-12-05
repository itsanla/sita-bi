'use client';

import { useEffect, useState, FormEvent } from 'react';
import request from '@/lib/api';
import {
  PlusCircle,
  Loader,
  Info,
  CheckCircle,
  XCircle,
  BookOpen,
  Users,
  Search,
  AlertTriangle,
} from 'lucide-react';

// --- Interfaces ---
interface TawaranTopik {
  id: number;
  judul_topik: string;
  deskripsi: string;
  kuota: number;
}

interface Application {
  id: number;
  status: string;
  mahasiswa: {
    user: {
      name: string;
      email: string;
    };
  };
  tawaranTopik: {
    judul_topik: string;
  };
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
  const [kuota, setKuota] = useState(1);
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
      }>('/tugas-akhir/check-similarity', {
        method: 'POST',
        data: { judul },
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
        data: { judul_topik: judul, deskripsi, kuota: Number(kuota) },
      });
      alert('Topik berhasil dibuat!');
      setJudul('');
      setDeskripsi('');
      setKuota(1);
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
        <div>
          <label
            htmlFor="kuota"
            className="block text-sm font-medium text-gray-700"
          >
            Kuota
          </label>
          <input
            id="kuota"
            type="number"
            value={kuota}
            onChange={(e) => setKuota(parseInt(e.target.value, 10))}
            min={1}
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
                <p className="font-semibold text-red-900">Pengajuan Diblokir</p>
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
  );
}

// --- Main Page Component ---
export default function TawaranTopikPage() {
  const [topics, setTopics] = useState<TawaranTopik[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsRes, appsRes] = await Promise.all([
        request<{ data: TawaranTopik[] }>('/tawaran-topik'),
        request<{ data: Application[] }>('/tawaran-topik/applications'),
      ]);
      if (Array.isArray(topicsRes.data)) {
        setTopics(topicsRes.data);
      }
      if (Array.isArray(appsRes.data)) {
        setApplications(appsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplication = async (
    appId: number,
    action: 'approve' | 'reject',
  ) => {
    if (!confirm(`Are you sure you want to ${action} this application?`))
      return;

    try {
      await request(`/tawaran-topik/applications/${appId}/${action}`, {
        method: 'POST',
      });
      alert(`Application ${action}d successfully!`);
      fetchData(); // Refresh all data
    } catch (err) {
      alert(
        `Failed to ${action} application: ${
          err instanceof Error ? err.message : 'An unknown error occurred'
        }`,
      );
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tawaran Topik</h1>
        <div className="flex gap-3">
          <a
            href="/dashboard/dosen/tawaran-topik/semua"
            className="inline-flex items-center justify-center px-4 py-2 border border-maroon-700 text-sm font-medium rounded-md shadow-sm text-maroon-700 bg-white hover:bg-maroon-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 transition"
          >
            <BookOpen size={16} className="mr-2" />
            Lihat Semua Topik
          </a>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 transition"
          >
            <PlusCircle size={16} className="mr-2" />
            {showCreateForm ? 'Tutup Form' : 'Buat Topik Baru'}
          </button>
        </div>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kuota
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800 font-medium">
                      {topic.kuota}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Applications Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Users size={24} className="mr-3 text-maroon-700" /> Aplikasi
          Mahasiswa untuk Topik Saya
        </h2>
        {!!loading && (
          <div className="flex items-center justify-center p-6">
            <Loader className="animate-spin text-maroon-700" size={24} />
          </div>
        )}
        {!loading && applications.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            <Info size={32} className="mx-auto mb-2" />
            <p>Tidak ada aplikasi yang masuk saat ini.</p>
          </div>
        )}
        {!loading && applications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mahasiswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topik yang Dilamar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {app.mahasiswa.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.mahasiswa.user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {app.tawaranTopik.judul_topik}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApplication(app.id, 'approve')}
                        className="inline-flex items-center justify-center p-2 border border-transparent rounded-full text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                        title="Setujui"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={() => handleApplication(app.id, 'reject')}
                        className="inline-flex items-center justify-center p-2 border border-transparent rounded-full text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                        title="Tolak"
                      >
                        <XCircle size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
