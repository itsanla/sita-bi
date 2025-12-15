'use client';

import {
  BookUser,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  ChevronRight,
  Users,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { PeriodeSelector } from '@/components/PeriodeSelector';
import WelcomeSection from './components/WelcomeSection';
import { useEffect, useState } from 'react';
import request from '@/lib/api';
import { useAturanValidasi } from '@/hooks/useAturanValidasi';

interface TugasAkhir {
  id: number;
  judul: string;
  mahasiswa: {
    user: { name: string };
    nim: string;
  };
  bimbinganTa: { status_bimbingan: string }[];
  dokumenTa: {
    divalidasi_oleh_p1: number | null;
    divalidasi_oleh_p2: number | null;
  }[];
}

export default function DosenDashboardPage() {
  const { user } = useAuth();
  const roles = user?.roles.map((r) => r.name) || [];
  const [mahasiswaList, setMahasiswaList] = useState<TugasAkhir[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDrafValid } = useAturanValidasi();

  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        const response = await request<{ data: { data: TugasAkhir[] } }>(
          '/bimbingan/sebagai-dosen',
        );
        setMahasiswaList(response.data?.data?.data || []);
      } catch (error) {
        console.error('Error fetching mahasiswa:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMahasiswa();
    }
  }, [user]);

  const isJurusan = roles.includes('jurusan');
  const isProdi = roles.includes('prodi_d3') || roles.includes('prodi_d4');

  const featureCards = [
    {
      title: 'Bimbingan Mahasiswa',
      description:
        'Kelola dan pantau kemajuan bimbingan tugas akhir mahasiswa.',
      href: '/dashboard/dosen/bimbingan',
      icon: BookUser,
      color: 'text-red-700',
      show: true,
    },
    {
      title: 'Tawaran Topik',
      description:
        'Publikasikan dan kelola topik tugas akhir yang Anda tawarkan.',
      href: '/dashboard/dosen/tawaran-topik',
      icon: Lightbulb,
      color: 'text-red-700',
      show: true,
    },
    {
      title: 'Persetujuan Sidang',
      description: 'Review dan berikan persetujuan untuk pendaftaran sidang.',
      href: '/dashboard/dosen/sidang-approvals',
      icon: ClipboardCheck,
      color: 'text-red-700',
      show: true,
    },
    {
      title: 'Penilaian Sidang',
      description: 'Akses dan isi formulir penilaian untuk sidang tugas akhir.',
      href: '/dashboard/dosen/penilaian',
      icon: GraduationCap,
      color: 'text-red-700',
      show: true,
    },
    // Kaprodi/Kajur Specific
    {
      title: 'Manajemen Mahasiswa & TA',
      description: isJurusan
        ? 'Kelola semua mahasiswa dan TA Jurusan'
        : 'Kelola mahasiswa dan TA Prodi',
      href: '/dashboard/admin/users', // Assuming redirection to admin features for these roles
      icon: Users,
      color: 'text-blue-700',
      show: isJurusan || isProdi,
    },
    {
      title: 'Dashboard Monitoring',
      description:
        'Pantau statistik dan progres TA tingkat ' +
        (isJurusan ? 'Jurusan' : 'Prodi'),
      href: '/dashboard/admin', // Assuming redirection to admin dashboard
      icon: LayoutDashboard,
      color: 'text-blue-700',
      show: isJurusan || isProdi,
    },
  ];

  const visibleCards = featureCards.filter((card) => card.show);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-end">
        <PeriodeSelector />
      </div>
      <WelcomeSection />
      
      {/* Syarat Pendaftaran Sidang per Mahasiswa */}
      {mahasiswaList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Status Kelayakan Sidang Mahasiswa</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : (
            <div className="space-y-4">
              {mahasiswaList.map((mhs) => {
                const validBimbinganCount = mhs.bimbinganTa.filter(
                  (b) => b.status_bimbingan === 'selesai'
                ).length;
                const latestDokumen = mhs.dokumenTa[0];
                const isDrafValidated = latestDokumen
                  ? isDrafValid(
                      latestDokumen.divalidasi_oleh_p1,
                      latestDokumen.divalidasi_oleh_p2
                    )
                  : false;
                const isEligible = validBimbinganCount >= 8 && isDrafValidated;

                return (
                  <div
                    key={mhs.id}
                    className={`p-4 rounded-lg border ${
                      isEligible
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {mhs.mahasiswa.user.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{mhs.mahasiswa.user.name}</h3>
                            <p className="text-sm text-gray-600">{mhs.mahasiswa.nim}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{mhs.judul}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isEligible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isEligible ? (
                          <CheckCircle size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        {isEligible ? 'Layak Sidang' : 'Belum Layak'}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          validBimbinganCount >= 8 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {validBimbinganCount >= 8 ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : (
                            <XCircle className="text-red-600" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bimbingan Valid</p>
                          <p className="font-semibold text-gray-900">{validBimbinganCount}/8 sesi</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDrafValidated ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isDrafValidated ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : (
                            <XCircle className="text-red-600" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Validasi Draf</p>
                          <p className={`font-semibold ${
                            isDrafValidated ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {isDrafValidated ? 'Valid' : 'Belum Valid'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Selamat Datang, {user?.nama}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Peran: {roles.join(', ').toUpperCase()}
          </p>
          <p className="text-lg text-gray-600">
            Pilih salah satu menu di bawah untuk mengelola aktivitas akademik
            Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleCards.map((card) => (
            <Link href={card.href} key={card.title}>
              <div
                className={`group bg-gray-50 hover:bg-opacity-50 border border-gray-200 p-6 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${card.color.replace('text', 'hover:border')}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <card.icon
                      className={`w-12 h-12 mb-4 ${card.color} transition-transform group-hover:scale-110`}
                    />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                  </div>
                  <ChevronRight
                    className={`w-6 h-6 text-gray-400 ${card.color.replace('text-', 'group-hover:text-')} transition-transform group-hover:translate-x-1`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
