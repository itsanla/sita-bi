'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api';
import {
  Loader,
  Info,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface TawaranTopik {
  id: number;
  judul_topik: string;
  deskripsi: string;
  kuota: number;
  dosenPencetus: {
    name: string;
    email: string;
  };
  historyTopik: Array<{
    id: number;
    status: string;
    mahasiswa: {
      user: {
        name: string;
        email: string;
      };
    };
  }>;
}

export default function SemuaTawaranTopikPage() {
  const [topics, setTopics] = useState<TawaranTopik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await request<{ data: TawaranTopik[] }>(
        '/tawaran-topik/all/with-applications',
      );
      if (Array.isArray(res.data)) {
        setTopics(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-maroon-900 to-maroon-800 p-3 rounded-xl shadow-md">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Semua Tawaran Topik
          </h1>
          <p className="text-gray-600">
            Lihat semua tawaran topik dari dosen dan aplikasi mahasiswa
          </p>
        </div>
      </div>

      {!!loading && (
        <div className="flex items-center justify-center p-12">
          <Loader className="animate-spin text-maroon-700" size={32} />
        </div>
      )}
      {!loading && topics.length === 0 && (
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
          <Info size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">
            Belum ada tawaran topik yang tersedia.
          </p>
        </div>
      )}
      {!loading && topics.length > 0 && (
        <div className="space-y-6">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-maroon-50 to-white p-6 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {topic.judul_topik}
                    </h3>
                    <p className="text-gray-600 mb-4">{topic.deskripsi}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <User className="h-4 w-4 text-maroon-700" />
                        <span className="text-sm font-medium text-gray-700">
                          {topic.dosenPencetus.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Kuota: {topic.kuota}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Aplikasi Mahasiswa
                </h4>
                {topic.historyTopik.length === 0 ? (
                  <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                    <Info size={24} className="mx-auto mb-2" />
                    <p className="text-sm">
                      Belum ada mahasiswa yang mengajukan topik ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topic.historyTopik.map((history) => (
                      <div
                        key={history.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-full flex items-center justify-center text-white font-bold">
                            {history.mahasiswa.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {history.mahasiswa.user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {history.mahasiswa.user.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          {history.status === 'disetujui' && (
                            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">
                                Disetujui
                              </span>
                            </div>
                          )}
                          {history.status === 'ditolak' && (
                            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">
                              <XCircle size={16} />
                              <span className="text-sm font-medium">
                                Ditolak
                              </span>
                            </div>
                          )}
                          {history.status === 'diajukan' && (
                            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg">
                              <Clock size={16} />
                              <span className="text-sm font-medium">
                                Menunggu
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
