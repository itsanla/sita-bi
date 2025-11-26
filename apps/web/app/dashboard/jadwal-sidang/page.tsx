'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// --- Type Definitions ---
interface Ruangan {
  nama_ruangan: string;
}

interface Jadwal {
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: Ruangan;
}

interface DosenInfo {
  user: { name: string };
}

interface PeranDosen {
  peran: string;
  dosen: DosenInfo;
}

interface Sidang {
  id: number;
  jenis_sidang: string;
  status_hasil: string;
  tugasAkhir: {
    judul: string;
    mahasiswa?: { user: { name: string } }; // Optional for dosen view
    peranDosenTa?: PeranDosen[]; // Optional for dosen view
  };
  jadwalSidang: Jadwal[];
}

// --- Main Component ---
export default function ViewJadwalSidangPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jadwalList, setJadwalList] = useState<Sidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let endpoint = '';
    if (user) {
      const role = user.roles[0]?.name;
      if (role === 'admin') {
        router.replace('/dashboard/admin/jadwal-sidang');
        return;
      } else if (role === 'dosen') {
        endpoint = '/jadwal-sidang/for-penguji';
      } else if (role === 'mahasiswa') {
        endpoint = '/jadwal-sidang/for-mahasiswa';
      }
    }

    if (!endpoint) {
      setLoading(false);
      // Don't set an error, just show nothing if user has no relevant role
      return;
    }

    const fetchJadwal = async () => {
      try {
        const response = await api<{ data: { data: Sidang[] } }>(endpoint);
        if (Array.isArray(response.data?.data)) {
          setJadwalList(response.data.data);
        }
      } catch {
        setError('Gagal memuat jadwal sidang.');
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, [user, authLoading, router]);

  const renderDosenView = () => (
    <div className="space-y-6">
      {jadwalList.map((sidang) => (
        <div key={sidang.id} className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold">{sidang.tugasAkhir.judul}</h3>
          <p className="text-md text-gray-600">
            Mahasiswa: {sidang.tugasAkhir.mahasiswa?.user.name}
          </p>
          {sidang.jadwalSidang[0] ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <p>
                <strong>Tanggal:</strong>{' '}
                {new Date(sidang.jadwalSidang[0].tanggal).toLocaleDateString(
                  'id-ID',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </p>
              <p>
                <strong>Waktu:</strong> {sidang.jadwalSidang[0].waktu_mulai} -{' '}
                {sidang.jadwalSidang[0].waktu_selesai}
              </p>
              <p>
                <strong>Ruangan:</strong>{' '}
                {sidang.jadwalSidang[0].ruangan.nama_ruangan}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="font-medium text-blue-600">
                  {sidang.status_hasil.replace('_', ' ')}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderMahasiswaView = () => {
    const sidang = jadwalList[0]; // Mahasiswa likely has only one active schedule
    if (!sidang) return null;

    const pembimbing = sidang.tugasAkhir.peranDosenTa?.filter((p) =>
      p.peran.includes('pembimbing'),
    );
    const penguji = sidang.tugasAkhir.peranDosenTa?.filter((p) =>
      p.peran.includes('penguji'),
    );

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          Jadwal Sidang Tugas Akhir Anda
        </h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {sidang.tugasAkhir.judul}
        </h3>
        {sidang.jadwalSidang[0] ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-md">
            <div>
              <p>
                <strong>Tanggal:</strong>
              </p>
              <p>
                {new Date(sidang.jadwalSidang[0].tanggal).toLocaleDateString(
                  'id-ID',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </p>
            </div>
            <div>
              <p>
                <strong>Waktu:</strong>
              </p>
              <p>
                {sidang.jadwalSidang[0].waktu_mulai} -{' '}
                {sidang.jadwalSidang[0].waktu_selesai}
              </p>
            </div>
            <div>
              <p>
                <strong>Ruangan:</strong>
              </p>
              <p>{sidang.jadwalSidang[0].ruangan.nama_ruangan}</p>
            </div>
            <div>
              <p>
                <strong>Status:</strong>
              </p>
              <p className="font-semibold text-blue-600">
                {sidang.status_hasil.replace('_', ' ')}
              </p>
            </div>
          </div>
        ) : (
          <p>Jadwal belum ditentukan.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-2">Dosen Pembimbing</h4>
            <ul className="list-disc list-inside">
              {pembimbing?.map((p) => (
                <li key={p.dosen.user.name}>{p.dosen.user.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">Dosen Penguji</h4>
            <ul className="list-disc list-inside">
              {penguji?.map((p) => (
                <li key={p.dosen.user.name}>{p.dosen.user.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading || authLoading) return <div>Loading...</div>;
  if (error)
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;

  const isDosen = user?.roles?.some((r) => r.name === 'dosen');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Jadwal Sidang</h1>
      {jadwalList.length > 0 ? (
        isDosen ? (
          renderDosenView()
        ) : (
          renderMahasiswaView()
        )
      ) : (
        <div className="text-center text-gray-500 mt-8">
          <p>Tidak ada jadwal sidang yang tersedia untuk Anda saat ini.</p>
        </div>
      )}
    </div>
  );
}
