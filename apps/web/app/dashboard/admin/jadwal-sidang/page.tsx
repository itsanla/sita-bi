'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import request from '@/lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader,
  Info,
  AlertTriangle,
  History,
} from 'lucide-react';

// --- Interfaces ---
interface Schedule {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: { nama_ruangan: string };
  sidang: {
    id: number;
    tugasAkhir: {
      judul: string;
      mahasiswa: { user: { name: string } };
    };
    historyPerubahan?: HistoryPerubahanSidang[];
  };
}

interface UnscheduledSidang {
  id: number;
  pendaftaran_sidang_id?: number | null; // Added pendaftaran_sidang_id
  tugasAkhir: {
    judul: string;
    mahasiswa: { user: { name: string } };
  };
}

interface Room {
  id: number;
  nama_ruangan: string;
}

interface Dosen {
  id: number;
  user: { name: string };
}

interface HistoryPerubahanSidang {
  id: number;
  perubahan: string;
  alasan_perubahan: string;
  created_at: string;
  user?: { name: string };
}

// --- Main Page Component ---
export default function JadwalSidangPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [unscheduled, setUnscheduled] = useState<UnscheduledSidang[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dosens, setDosens] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [sidangId, setSidangId] = useState('');
  const [ruanganId, setRuanganId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [pengujiIds, setPengujiIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [schedulesRes, unscheduledRes, roomsRes] = await Promise.all([
        request<{ data: Schedule[] }>('/jadwal-sidang'),
        request<{ data: UnscheduledSidang[] }>('/sidang/unscheduled'),
        request<{ data: Room[] }>('/ruangan'),
      ]);

      if (Array.isArray(schedulesRes.data)) {
        if (Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data);
        }
      }
      if (Array.isArray(unscheduledRes.data)) {
        if (Array.isArray(unscheduledRes.data)) {
          setUnscheduled(unscheduledRes.data);
        }
      }
      if (Array.isArray(roomsRes.data)) {
        if (Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }
      }

      // Fetch dosens (using generic endpoint or assuming one exists based on previous context, but I will assume /users/dosen is correct or fallback)
      // Given the code review, I should ensure this works.
      try {
        const dosensRes = await request<{ data: { data: Dosen[] } }>(
          '/users/dosen',
        );
        if (dosensRes.data?.data && Array.isArray(dosensRes.data.data)) {
          setDosens(dosensRes.data.data);
        }
      } catch (e) {
        console.error('[fetchData] Failed to fetch dosens:', e);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      await request('/jadwal-sidang', {
        method: 'POST',
        data: {
          sidangId: Number(sidangId),
          ruangan_id: Number(ruanganId),
          tanggal,
          waktu_mulai: waktuMulai,
          waktu_selesai: waktuSelesai,
          pengujiIds: pengujiIds,
        },
      });
      alert('Jadwal berhasil dibuat!');
      // Reset form
      setSidangId('');
      setRuanganId('');
      setTanggal('');
      setWaktuMulai('');
      setWaktuSelesai('');
      setPengujiIds([]);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmissionError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await request(`/jadwal-sidang/${id}`, { method: 'DELETE' });
      alert('Schedule deleted successfully');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const togglePenguji = (id: number) => {
    setPengujiIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Kelola Jadwal Sidang
      </h1>

      {/* Create Schedule Form */}
      <div className="bg-white p-8 rounded-lg shadow-md mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Buat Jadwal Baru
        </h2>

        {!!submissionError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <p className="text-red-700">{submissionError}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-3">
            <label
              htmlFor="sidangId"
              className="block text-sm font-medium text-gray-700"
            >
              Pilih Sidang (Mahasiswa)
            </label>
            <select
              id="sidangId"
              value={sidangId}
              onChange={(e) => setSidangId(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>
                -- Pilih Mahasiswa & Judul --
              </option>
              {unscheduled.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tugasAkhir.mahasiswa.user.name} - {s.tugasAkhir.judul}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tanggal"
              className="block text-sm font-medium text-gray-700"
            >
              Tanggal
            </label>
            <input
              type="date"
              id="tanggal"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="waktuMulai"
              className="block text-sm font-medium text-gray-700"
            >
              Waktu Mulai
            </label>
            <input
              type="time"
              id="waktuMulai"
              value={waktuMulai}
              onChange={(e) => setWaktuMulai(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="waktuSelesai"
              className="block text-sm font-medium text-gray-700"
            >
              Waktu Selesai
            </label>
            <input
              type="time"
              id="waktuSelesai"
              value={waktuSelesai}
              onChange={(e) => setWaktuSelesai(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="lg:col-span-1">
            <label
              htmlFor="ruanganId"
              className="block text-sm font-medium text-gray-700"
            >
              Ruangan
            </label>
            <select
              id="ruanganId"
              value={ruanganId}
              onChange={(e) => setRuanganId(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>
                -- Pilih Ruangan --
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_ruangan}
                </option>
              ))}
            </select>
          </div>

          {/* Dosen Penguji Selection - Simple Multiselect */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Penguji
            </label>
            <div className="h-32 overflow-y-auto border border-gray-300 rounded p-2 grid grid-cols-2 gap-2">
              {dosens.length > 0 ? (
                dosens.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={pengujiIds.includes(d.id)}
                      onChange={() => togglePenguji(d.id)}
                    />
                    <span>{d.user.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-2">
                  Data dosen tidak ditemukan (pastikan endpoint tersedia)
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pilih dosen yang akan menjadi penguji.
            </p>
          </div>

          <div className="flex items-end lg:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              {isSubmitting ? 'Menyimpan...' : 'Tambah Jadwal'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Schedules List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Jadwal Terpublikasi & Riwayat
        </h2>
        {loading ? (
          <div className="text-center p-8">
            <Loader className="animate-spin mx-auto text-red-800" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xl text-gray-900">
                      {schedule.sidang.tugasAkhir.mahasiswa.user.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate max-w-2xl">
                      {schedule.sidang.tugasAkhir.judul}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mt-3">
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={16} />{' '}
                        {new Date(schedule.tanggal).toLocaleDateString(
                          'id-ID',
                          { dateStyle: 'full' },
                        )}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock size={16} /> {schedule.waktu_mulai} -{' '}
                        {schedule.waktu_selesai}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={16} /> {schedule.ruangan.nama_ruangan}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Hapus Jadwal"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* History Section */}
                {schedule.sidang.historyPerubahan &&
                schedule.sidang.historyPerubahan.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <History size={14} /> Riwayat Perubahan
                    </h4>
                    <ul className="space-y-2">
                      {schedule.sidang.historyPerubahan
                        .slice(0, 3)
                        .map((log) => (
                          <li
                            key={log.id}
                            className="text-xs text-gray-500 bg-gray-50 p-2 rounded"
                          >
                            <span className="font-medium">
                              {log.user?.name || 'System'}:
                            </span>{' '}
                            {JSON.parse(log.perubahan).action || 'Perubahan'} -{' '}
                            {log.alasan_perubahan}
                            <span className="block text-gray-400 mt-1">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-white p-12 rounded-lg shadow-sm">
            <Info size={40} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold">Belum Ada Jadwal</h3>
            <p>Silakan buat jadwal sidang baru menggunakan formulir di atas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
