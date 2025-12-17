import {
  Users,
  BookOpen,
  Home,
  GraduationCap,
  UserCheck,
  Shield,
  Layout,
  Zap,
} from 'lucide-react';

export const menuItems = [
  {
    id: 'team',
    label: 'Tim Pengembang',
    icon: Users,
  },
  {
    id: 'introduction',
    label: 'Pengenalan',
    icon: BookOpen,
    children: [
      { id: 'intro-overview', label: 'Tentang SITA-BI' },
      { id: 'intro-architecture', label: 'Arsitektur Sistem' },
      { id: 'intro-requirements', label: 'Persyaratan Sistem' },
    ],
  },
  {
    id: 'getting-started',
    label: 'Memulai',
    icon: Home,
    children: [
      { id: 'gs-registration', label: 'Registrasi Akun' },
      { id: 'gs-login', label: 'Login & Autentikasi' },
      { id: 'gs-dashboard', label: 'Navigasi Dashboard' },
    ],
  },
  {
    id: 'mahasiswa',
    label: 'Panduan Mahasiswa',
    icon: GraduationCap,
    children: [
      { id: 'mhs-topik', label: 'Memilih Topik TA' },
      { id: 'mhs-bimbingan', label: 'Sistem Bimbingan' },
      { id: 'mhs-sidang', label: 'Jadwal Sidang' },
      { id: 'mhs-pengumuman', label: 'Pengumuman' },
    ],
  },
  {
    id: 'dosen',
    label: 'Panduan Dosen',
    icon: UserCheck,
    children: [
      { id: 'dsn-topik', label: 'Kelola Tawaran Topik' },
      { id: 'dsn-bimbingan', label: 'Bimbingan Mahasiswa' },
      { id: 'dsn-penilaian', label: 'Penilaian Sidang' },
      { id: 'dsn-approval', label: 'Persetujuan' },
    ],
  },
  {
    id: 'admin',
    label: 'Panduan Admin',
    icon: Shield,
    children: [
      { id: 'adm-users', label: 'Manajemen User' },
      { id: 'adm-jadwal', label: 'Pengaturan Jadwal' },
      { id: 'adm-pengumuman', label: 'Kelola Pengumuman' },
      { id: 'adm-laporan', label: 'Laporan Sistem' },
    ],
  },
  {
    id: 'features',
    label: 'Fitur & Modul',
    icon: Layout,
  },
  {
    id: 'technology',
    label: 'Teknologi',
    icon: Zap,
  },
];
