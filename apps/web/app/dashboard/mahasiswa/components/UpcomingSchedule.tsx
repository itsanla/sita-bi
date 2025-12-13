'use client';

import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import { useState, useEffect } from 'react';
import { usePeriode } from '@/context/PeriodeContext';
import api from '@/lib/api';

interface DokumenSidang {
  nama: string;
  wajib: boolean;
  uploaded: boolean;
}

export default function UpcomingSchedule() {
  const { selectedPeriodeId } = usePeriode();
  const [dokumen, setDokumen] = useState<DokumenSidang[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDokumen = async () => {
      try {
        setLoading(true);
        let dokumenWajib: string[] = [];
        
        try {
          const pengaturanRes = await api.get('/pengaturan');
          const syaratData = pengaturanRes.data?.data?.syarat_pendaftaran_sidang;
          
          if (Array.isArray(syaratData) && syaratData.length > 0) {
            dokumenWajib = syaratData.map((s: any) => s.label || s.key || s);
          } else {
            throw new Error('No syarat data');
          }
        } catch {
          dokumenWajib = [
            'Naskah TA',
            'Sertifikat TOEIC', 
            'Transkrip Nilai',
            'Ijazah SLTA',
            'Surat Bebas Jurusan'
          ];
        }

        const dokumenList = dokumenWajib.map((nama) => ({
          nama,
          wajib: true,
          uploaded: false,
        }));

        setDokumen(dokumenList);
      } catch (error) {
        console.error('Error fetching dokumen:', error);
        setDokumen([]);
      } finally {
        setLoading(false);
      }
    };
    if (selectedPeriodeId) fetchDokumen();
  }, [selectedPeriodeId]);

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Dokumen Pendaftaran Sidang
        </h3>
      </div>

      {dokumen.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm">Belum ada dokumen yang diatur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dokumen.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.nama}
                  </p>
                  {!!doc.wajib && <p className="text-xs text-red-600">Wajib</p>}
                </div>
              </div>
              {doc.uploaded ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
