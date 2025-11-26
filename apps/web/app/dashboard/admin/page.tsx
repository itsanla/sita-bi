'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Megaphone,
  Calendar,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 ${color} rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

interface QuickAccessLinkProps {
  title: string;
  description: string;
  href: string;
}

const QuickAccessLink = ({
  title,
  description,
  href,
}: QuickAccessLinkProps) => (
  <Link
    href={href}
    className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-red-900 hover:shadow-md transition-all"
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    <span className="inline-flex items-center gap-2 text-sm font-medium text-red-900 hover:gap-3 transition-all">
      Lanjutkan
      <ArrowRight className="w-4 h-4" />
    </span>
  </Link>
);

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Selamat datang! Kelola semua aspek sistem dari satu tempat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Total Pengguna"
          value="1,250"
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          title="Tugas Akhir Aktif"
          value="320"
          icon={BookOpen}
          color="bg-red-900"
        />
        <StatCard
          title="Pengumuman Terbit"
          value="42"
          icon={Megaphone}
          color="bg-orange-600"
        />
        <StatCard
          title="Sidang Terjadwal"
          value="18"
          icon={Calendar}
          color="bg-green-600"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAccessLink
            title="Buat Pengumuman Baru"
            description="Publikasikan informasi penting untuk semua pengguna."
            href="/dashboard/admin/pengumuman/create"
          />
          <QuickAccessLink
            title="Jadwalkan Sidang"
            description="Atur dan publikasikan jadwal sidang baru."
            href="/dashboard/admin/jadwal-sidang"
          />
          <QuickAccessLink
            title="Kelola Penugasan"
            description="Assign pembimbing dan penguji untuk mahasiswa."
            href="/dashboard/admin/penugasan"
          />
        </div>
      </div>
    </div>
  );
}
