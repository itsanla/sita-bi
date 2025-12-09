'use client';

import PeriodeGuard from '@/components/shared/PeriodeGuard';
import TAGuard from '@/components/shared/TAGuard';
import JadwalSidangGuard from '@/components/shared/JadwalSidangGuard';

export default function JadwalSidangMahasiswaPage() {
  return (
    <PeriodeGuard>
      <TAGuard>
        <JadwalSidangGuard>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Jadwal Sidang Saya
              </h1>
              <p className="text-sm text-gray-600">
                Lihat jadwal sidang tugas akhir Anda
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">
                Ini contoh tampilan, generate sidang masih dalam pengembangan
              </p>
            </div>
          </div>
        </JadwalSidangGuard>
      </TAGuard>
    </PeriodeGuard>
  );
}
