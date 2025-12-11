'use client';

import { useRBAC } from '@/hooks/useRBAC';
import Pengumuman from '@/components/shared/Pengumuman';
import KelolaPengumuman from '@/components/shared/KelolaPengumuman';

export default function DosenPengumumanPage() {
  const { isJurusan, isProdi } = useRBAC();

  const canManage = isJurusan || isProdi;

  if (!canManage) {
    return (
      <div className="space-y-6">
        <Pengumuman />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Pengumuman />
      <div className="border-t-2 border-gray-200 pt-8">
        <KelolaPengumuman />
      </div>
    </div>
  );
}
