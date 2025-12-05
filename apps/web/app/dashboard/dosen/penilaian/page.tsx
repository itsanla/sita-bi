'use client';
import PeriodeGuard from '@/components/shared/PeriodeGuard';

import { useEffect, useState, FormEvent } from 'react';
import request from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { usePeriodeStatus } from '@/hooks/usePeriodeStatus';
import { Loader, Info, Send, List, Calendar, Clock, Home } from 'lucide-react';

// --- Interfaces ---
interface Nilai {
  id: number;
  aspek: string;
  skor: number;
}

interface Sidang {
  id: number;
  tugasAkhir: {
    judul: string;
    mahasiswa: { user: { name: string } };
  };
  jadwalSidang: {
    tanggal: string;
    waktu_mulai: string;
    ruangan: { nama_ruangan: string };
  }[];
  nilaiSidang: Nilai[];
}

// --- Child Components ---
function PenilaianForm({
  sidangId,
  onScoringSuccess,
}: {
  sidangId: number;
  onScoringSuccess: () => void;
}) {
  const [aspek, setAspek] = useState('');
  const [skor, setSkor] = useState(80);
  const [komentar, setKomentar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await request('/penilaian', {
        method: 'POST',
        data: { sidang_id: sidangId, aspek, skor: Number(skor), komentar },
      });
      alert('Score submitted successfully!');
      setAspek('');
      setSkor(80);
      setKomentar('');
      onScoringSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PeriodeGuard>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 mt-4 pt-4 border-t border-gray-200"
      >
        <h4 className="text-lg font-semibold text-gray-800">
          Formulir Penilaian Baru
        </h4>
        {error ? (
          <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`aspek-${sidangId}`}
              className="block text-sm font-medium text-gray-700"
            >
              Aspek Penilaian
            </label>
            <input
              id={`aspek-${sidangId}`}
              type="text"
              value={aspek}
              onChange={(e) => setAspek(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor={`skor-${sidangId}`}
              className="block text-sm font-medium text-gray-700"
            >
              Skor (0-100)
            </label>
            <input
              id={`skor-${sidangId}`}
              type="number"
              value={skor}
              onChange={(e) => setSkor(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor={`komentar-${sidangId}`}
            className="block text-sm font-medium text-gray-700"
          >
            Komentar
          </label>
          <textarea
            id={`komentar-${sidangId}`}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 disabled:bg-gray-400"
          >
            {submitting ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Submit Nilai
          </button>
        </div>
      </form>
    </PeriodeGuard>
  );
}

// --- Main Page Component ---
export default function PenilaianPage() {
  const { user } = useAuth();
  const { status: periodeStatus, loading: periodeLoading } = usePeriodeStatus();
  const [assignedSidang, setAssignedSidang] = useState<Sidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await request<{ data: { data: Sidang[] } }>(
        '/jadwal-sidang/for-penguji',
      );
      if (Array.isArray(data.data?.data)) {
        setAssignedSidang(data.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !periodeLoading && periodeStatus?.isActive) {
      fetchData();
    } else if (!periodeLoading) {
      setLoading(false);
    }
  }, [user, periodeLoading, periodeStatus?.isActive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">Loading data...</span>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-800">Penilaian Sidang</h1>

        {assignedSidang.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-white p-12 rounded-2xl shadow-lg">
            <Info size={48} className="mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold">
              Tidak Ada Jadwal Penilaian
            </h2>
            <p className="mt-1">
              Saat ini tidak ada sidang yang ditugaskan kepada Anda untuk
              dinilai.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignedSidang.map((sidang) => (
              <div
                key={sidang.id}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sidang.tugasAkhir.mahasiswa.user.name}
                  </h2>
                  <p className="text-md text-gray-600">
                    {sidang.tugasAkhir.judul}
                  </p>
                  {sidang.jadwalSidang[0] ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} />{' '}
                        {new Date(
                          sidang.jadwalSidang[0].tanggal,
                        ).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={14} /> {sidang.jadwalSidang[0].waktu_mulai}
                      </span>
                      <span className="flex items-center gap-2">
                        <Home size={14} />{' '}
                        {sidang.jadwalSidang[0].ruangan.nama_ruangan}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                    <List size={18} className="mr-2" /> Skor yang Telah
                    Diberikan
                  </h4>
                  {sidang.nilaiSidang.length > 0 ? (
                    <ul className="space-y-2">
                      {sidang.nilaiSidang.map((n) => (
                        <li
                          key={n.id}
                          className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {n.aspek}
                          </span>
                          <span className="text-sm font-bold text-maroon-800 bg-maroon-100 px-2 py-1 rounded-full">
                            {n.skor}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Belum ada skor yang dimasukkan.
                    </p>
                  )}
                </div>

                <PenilaianForm
                  sidangId={sidang.id}
                  onScoringSuccess={fetchData}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PeriodeGuard>
  );
}
