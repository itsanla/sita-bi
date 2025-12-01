'use client';

import {
  BookUser,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  ChevronRight,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function DosenDashboardPage() {
  const { user } = useAuth();
  const roles = user?.roles.map((r) => r.name) || [];

  const isJurusan = roles.includes('jurusan');
  const isProdi =
    roles.includes('prodi_d3') || roles.includes('prodi_d4');

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
    <div className="bg-white p-8 rounded-2xl shadow-lg">
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
  );
}
