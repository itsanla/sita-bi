'use client';

import { AlertCircle, UserX, FileX, CheckCircle } from 'lucide-react';

interface TANotAllowedProps {
  type:
    | 'no-ta'
    | 'no-pembimbing'
    | 'judul-not-validated'
    | 'not-registered-sidang'
    | 'registered-sidang-info'
    | 'custom';
  customMessage?: string;
  customTitle?: string;
}

export default function TANotAllowed({
  type,
  customMessage,
  customTitle,
}: TANotAllowedProps) {
  const getConfig = () => {
    switch (type) {
      case 'no-ta':
        return {
          icon: (
            <FileX
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-red-400 to-red-600',
          title: 'Belum Memiliki Tugas Akhir',
          message:
            'Anda belum terdaftar dalam sistem Tugas Akhir. Silakan ajukan pembimbing terlebih dahulu untuk memulai proses Tugas Akhir.',
          actionText:
            'Hubungi Ketua Jurusan atau ajukan pembimbing melalui menu Pengajuan Bimbingan.',
        };
      case 'no-pembimbing':
        return {
          icon: (
            <UserX
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-amber-400 to-amber-600',
          title: 'Belum Memiliki Pembimbing',
          message:
            'Anda belum memiliki pembimbing Tugas Akhir. Pembimbing diperlukan untuk mengakses fitur ini.',
          actionText:
            'Silakan ajukan pembimbing melalui menu Pengajuan Bimbingan.',
        };
      case 'judul-not-validated':
        return {
          icon: (
            <CheckCircle
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-blue-400 to-blue-600',
          title: 'Judul Belum Divalidasi',
          message:
            'Judul Tugas Akhir Anda belum divalidasi oleh pembimbing. Validasi judul diperlukan untuk melanjutkan ke tahap berikutnya.',
          actionText:
            'Tunggu pembimbing memvalidasi judul Anda atau hubungi pembimbing untuk konfirmasi.',
        };
      case 'not-registered-sidang':
        return {
          icon: (
            <AlertCircle
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-red-400 to-red-600',
          title: 'Belum Mendaftar Sidang',
          message: 'Anda belum mendaftar sidang.',
          actionText:
            'Silakan daftar sidang terlebih dahulu melalui menu Pendaftaran Sidang.',
        };
      case 'registered-sidang-info':
        return {
          icon: (
            <CheckCircle
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-green-400 to-green-600',
          title: 'Sudah Mendaftar Sidang',
          message:
            'Anda sudah mendaftar sidang, jadwal sidang anda akan muncul dihalaman ini saat telah di atur jurusan.',
          actionText: 'Tunggu pengumuman jadwal sidang dari jurusan.',
        };
      case 'custom':
        return {
          icon: (
            <AlertCircle
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-amber-400 to-amber-600',
          title: customTitle || 'Akses Ditolak',
          message: customMessage || 'Anda tidak memiliki akses ke fitur ini.',
          actionText: 'Hubungi administrator untuk informasi lebih lanjut.',
        };
      default:
        return {
          icon: (
            <AlertCircle
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              strokeWidth={2.5}
            />
          ),
          bgColorClass: 'bg-gradient-to-br from-amber-400 to-amber-600',
          title: 'Akses Ditolak',
          message: 'Anda tidak memiliki akses ke fitur ini.',
          actionText: 'Hubungi administrator untuk informasi lebih lanjut.',
        };
    }
  };

  const config = getConfig();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 ${config.bgColorClass} rounded-full flex items-center justify-center shadow-md`}
          >
            {config.icon}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
          {config.title}
        </h2>

        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
          {config.message}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <p className="text-xs text-gray-600">{config.actionText}</p>
        </div>
      </div>
    </div>
  );
}
