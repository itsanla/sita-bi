'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { handleApiError } from '../../lib/api';

interface JadwalSidang {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: { nama_ruangan: string };
}

interface Sidang {
  id: number;
  jenis_sidang: string;
  status_hasil: string;
  tugasAkhir: {
    judul: string;
    mahasiswa: {
      user: {
        name: string;
      };
    };
  };
  jadwalSidang: JadwalSidang[];
}

export default function JadwalSidangPage() {
  const [schedule, setSchedule] = useState<Sidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError('Anda harus login untuk melihat halaman ini.');
      setLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = user.roles?.some((r) => r.name === 'mahasiswa')
          ? '/jadwal-sidang/for-mahasiswa'
          : '/jadwal-sidang/for-penguji';

        const response = await api.get<{ data: Sidang[]; total: number }>(
          endpoint,
        );

        const sidangData = response.data.data?.data || [];
        setSchedule(sidangData);
      } catch (e) {
        setError(handleApiError(e));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user, authLoading]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-200 animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Jadwal Sidang
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Berikut adalah jadwal sidang yang akan datang.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading || authLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div
            className="text-center py-16 px-6 bg-red-50 rounded-xl shadow-md border border-red-200"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle
              size={64}
              className="mx-auto text-red-500 mb-6"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold text-red-800 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : schedule.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {schedule.map((sidang) => {
              const jadwal = sidang.jadwalSidang?.[0];
              if (!jadwal) return null;

              return (
                <article
                  key={sidang.id}
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-maroon hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    {sidang.tugasAkhir.judul}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-gray-700">
                    <div className="flex items-center gap-2">
                      <User
                        className="text-maroon flex-shrink-0"
                        size={20}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {sidang.tugasAkhir.mahasiswa.user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar
                        className="text-maroon flex-shrink-0"
                        size={20}
                        aria-hidden="true"
                      />
                      <span>{formatDate(jadwal.tanggal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock
                        className="text-maroon flex-shrink-0"
                        size={20}
                        aria-hidden="true"
                      />
                      <span>
                        {jadwal.waktu_mulai} - {jadwal.waktu_selesai}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building
                        className="text-maroon flex-shrink-0"
                        size={20}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {jadwal.ruangan.nama_ruangan}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="text-center py-16 px-6 bg-white rounded-xl shadow-md"
            role="status"
          >
            <Calendar
              size={64}
              className="mx-auto text-gray-400 mb-6"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Belum Ada Jadwal Sidang
            </h2>
            <p className="text-gray-500">
              Saat ini belum ada jadwal sidang yang ditetapkan untuk Anda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
