'use client';

import { useRBAC } from '../../../hooks/useRBAC';
import { useAuth } from '../../../context/AuthContext';

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  const { isKajur, isKaprodi, isDosen, isMahasiswa, canAccessProdi } = useRBAC();

  if (!user) return null;

  if (isKajur) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Kajur</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DashboardCard
            title="Total Mahasiswa"
            description="Semua prodi (D3 + D4)"
            link="/dashboard/admin/mahasiswa"
          />
          <DashboardCard
            title="Kelola Dosen"
            description="Assign pembimbing & penguji"
            link="/dashboard/admin/penugasan"
          />
          <DashboardCard
            title="Laporan Jurusan"
            description="Statistik & monitoring"
            link="/dashboard/admin/reports"
          />
        </div>
      </div>
    );
  }

  if (isKaprodi) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Dashboard Kaprodi {canAccessProdi}
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DashboardCard
            title={`Mahasiswa ${canAccessProdi}`}
            description="Kelola mahasiswa prodi"
            link="/dashboard/admin/mahasiswa"
          />
          <DashboardCard
            title="Validasi Judul"
            description="Approve pengajuan judul"
            link="/dashboard/admin/tugas-akhir"
          />
          <DashboardCard
            title="Assign Pembimbing"
            description="Kelola pembimbing prodi"
            link="/dashboard/admin/penugasan"
          />
        </div>
      </div>
    );
  }

  if (isDosen) {
    const assignedCount = user.dosen?.assignedMahasiswa?.length || 0;
    
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Dosen</h1>
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Anda membimbing <span className="font-bold">{assignedCount}</span> mahasiswa
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DashboardCard
            title="Mahasiswa Bimbingan"
            description={`${assignedCount} mahasiswa aktif`}
            link="/dashboard/dosen/bimbingan"
          />
          <DashboardCard
            title="Jadwal Bimbingan"
            description="Kelola jadwal & catatan"
            link="/dashboard/dosen/jadwal"
          />
        </div>
      </div>
    );
  }

  if (isMahasiswa) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Mahasiswa</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DashboardCard
            title="Tugas Akhir Saya"
            description="Status & progress"
            link="/dashboard/mahasiswa/tugas-akhir"
          />
          <DashboardCard
            title="Bimbingan"
            description="Jadwal & catatan bimbingan"
            link="/dashboard/mahasiswa/bimbingan"
          />
        </div>
      </div>
    );
  }

  return null;
}

function DashboardCard({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) {
  return (
    <a
      href={link}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
