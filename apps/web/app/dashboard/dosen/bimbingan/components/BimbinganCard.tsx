'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck,
} from 'lucide-react';
import {
  useKonfirmasiBimbingan,
  useAddCatatan,
  useBatalkanValidasi,
  useValidasiDraf,
} from '@/hooks/useBimbingan';

interface Dosen {
  user: { name: string };
}

interface Lampiran {
  id: number;
  file_name: string;
  created_at: string;
}

interface Catatan {
  id: number;
  catatan: string;
  created_at: string;
  author: { name: string };
}

interface BimbinganSession {
  id: number;
  sesi_ke: number;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  jam_selesai: string | null;
  status_bimbingan: string;
  peran: string;
  lampiran: Lampiran[];
  catatan: Catatan[];
}

interface DokumenTA {
  id: number;
  file_path: string;
  divalidasi_oleh_p1: number | null;
  divalidasi_oleh_p2: number | null;
}

interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  mahasiswa: {
    user: { name: string; email: string };
  };
  peranDosenTa: { peran: string; dosen: Dosen }[];
  bimbinganTa: BimbinganSession[];
  dokumenTa: DokumenTA[];
}

interface BimbinganCardProps {
  tugasAkhir: TugasAkhir;
  onRefresh: () => void;
  currentDosenPeran: string;
}

export default function BimbinganCard({
  tugasAkhir,
  onRefresh,
  currentDosenPeran,
}: BimbinganCardProps) {
  const [expandedSesi, setExpandedSesi] = useState<number | null>(null);
  const [newCatatan, setNewCatatan] = useState('');

  const konfirmasiMutation = useKonfirmasiBimbingan();
  const batalkanMutation = useBatalkanValidasi();
  const addCatatanMutation = useAddCatatan();
  const validasiDrafMutation = useValidasiDraf();

  const handleKonfirmasi = (sesiId: number) => {
    if (!confirm('Konfirmasi bahwa sesi bimbingan ini telah selesai?')) return;
    konfirmasiMutation.mutate(sesiId, {
      onSuccess: () => onRefresh(),
    });
  };

  const handleBatalkanValidasi = (sesiId: number) => {
    if (!confirm('Batalkan validasi sesi bimbingan ini?')) return;
    batalkanMutation.mutate(sesiId, {
      onSuccess: () => onRefresh(),
    });
  };

  const handleValidasiDraf = (dokumenId: number) => {
    if (!confirm('Validasi draf tugas akhir ini?')) return;
    validasiDrafMutation.mutate(dokumenId, {
      onSuccess: () => onRefresh(),
    });
  };

  const handleAddCatatan = (sesiId: number) => {
    if (!newCatatan.trim()) return;
    addCatatanMutation.mutate(
      { bimbingan_ta_id: sesiId, catatan: newCatatan },
      {
        onSuccess: () => {
          setNewCatatan('');
          onRefresh();
        },
      },
    );
  };

  const handleViewPdf = (filePath: string) => {
    const fileName = filePath.split('/').pop() || '';
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/files/dokumen-ta/${fileName}`;
    window.open(url, '_blank');
  };

  const validBimbinganCount = tugasAkhir.bimbinganTa.filter(
    (b) => b.status_bimbingan === 'selesai',
  ).length;

  const latestDokumen = tugasAkhir.dokumenTa?.[0];
  const isDrafValidatedP1 = !!latestDokumen?.divalidasi_oleh_p1;
  const isDrafValidatedP2 = !!latestDokumen?.divalidasi_oleh_p2;
  const canValidateDraf =
    latestDokumen &&
    ((currentDosenPeran === 'pembimbing1' && !isDrafValidatedP1) ||
      (currentDosenPeran === 'pembimbing2' && !isDrafValidatedP2));

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">{tugasAkhir.mahasiswa.user.name}</h2>
        <p className="text-gray-600 text-sm mt-1">{tugasAkhir.judul}</p>
        <div className="mt-3 flex items-center gap-4">
          <span className="text-sm">
            <span className="font-semibold">Status:</span> {tugasAkhir.status}
          </span>
          <span className="text-sm">
            <span className="font-semibold">Bimbingan Valid:</span>{' '}
            {validBimbinganCount}/9
          </span>
        </div>
      </div>

      {/* Draf TA Section */}
      {!!latestDokumen && (
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <FileCheck size={18} />
            Draf Tugas Akhir
          </h3>
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex items-center gap-3">
              <FileText className="text-red-600" size={28} />
              <div>
                <p className="font-semibold text-sm">Draf TA (PDF)</p>
                <div className="flex gap-2 mt-1">
                  {isDrafValidatedP1 ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      ✓ P1
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                      ⏳ P1
                    </span>
                  )}
                  {isDrafValidatedP2 ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      ✓ P2
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                      ⏳ P2
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewPdf(latestDokumen.file_path)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                <Eye size={14} />
                Lihat
              </button>
              {!!canValidateDraf && (
                <button
                  onClick={() => handleValidasiDraf(latestDokumen.id)}
                  disabled={validasiDrafMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                >
                  <FileCheck size={14} />
                  Validasi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-3">
        {tugasAkhir.bimbinganTa.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Belum ada sesi bimbingan
          </p>
        ) : (
          tugasAkhir.bimbinganTa.map((sesi) => {
            const isValidatedByMe =
              sesi.status_bimbingan === 'selesai' &&
              sesi.peran === currentDosenPeran;

            return (
              <div key={sesi.id} className="border rounded-lg overflow-hidden">
                <div
                  className={`p-4 flex justify-between items-center cursor-pointer ${
                    sesi.status_bimbingan === 'selesai'
                      ? 'bg-green-50'
                      : 'bg-gray-50'
                  }`}
                  onClick={() =>
                    setExpandedSesi(expandedSesi === sesi.id ? null : sesi.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {sesi.status_bimbingan === 'selesai' ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-gray-400" size={20} />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">
                        Sesi #{sesi.sesi_ke}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {sesi.tanggal_bimbingan
                          ? new Date(sesi.tanggal_bimbingan).toLocaleDateString(
                              'id-ID',
                            )
                          : 'Belum dijadwalkan'}
                        {!!sesi.jam_bimbingan && ` • ${sesi.jam_bimbingan}`}
                        {!!sesi.jam_selesai && ` - ${sesi.jam_selesai}`}
                      </p>
                      {sesi.status_bimbingan === 'selesai' && (
                        <p className="text-xs text-green-700 font-semibold mt-1">
                          Bimbingan ke-{sesi.sesi_ke} telah dilakukan dengan{' '}
                          {sesi.peran}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sesi.status_bimbingan !== 'selesai' &&
                      !!sesi.tanggal_bimbingan && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKonfirmasi(sesi.id);
                          }}
                          disabled={konfirmasiMutation.isPending}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                        >
                          Validasi
                        </button>
                      )}
                    {!!isValidatedByMe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBatalkanValidasi(sesi.id);
                        }}
                        disabled={batalkanMutation.isPending}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Batalkan
                      </button>
                    )}
                    {expandedSesi === sesi.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedSesi === sesi.id && (
                  <div className="p-4 space-y-4 bg-white">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Calendar size={14} />
                        Jadwal
                      </h4>
                      <div className="text-sm text-gray-700">
                        {sesi.tanggal_bimbingan ? (
                          <>
                            <p>
                              Tanggal:{' '}
                              {new Date(
                                sesi.tanggal_bimbingan,
                              ).toLocaleDateString('id-ID')}
                            </p>
                            <p>
                              Waktu: {sesi.jam_bimbingan || '-'} -{' '}
                              {sesi.jam_selesai || '-'}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 italic">
                            Belum dijadwalkan
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <FileText size={14} />
                        Lampiran ({sesi.lampiran.length})
                      </h4>
                      {sesi.lampiran.length > 0 ? (
                        <div className="space-y-1">
                          {sesi.lampiran.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                            >
                              <span className="truncate">{file.file_name}</span>
                              <span className="text-gray-500">
                                {new Date(file.created_at).toLocaleDateString(
                                  'id-ID',
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          Belum ada lampiran
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <MessageSquare size={14} />
                        Catatan
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                        {sesi.catatan.length > 0 ? (
                          sesi.catatan.map((note) => (
                            <div
                              key={note.id}
                              className="bg-gray-50 p-2 rounded text-xs"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold">
                                  {note.author.name}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(note.created_at).toLocaleString(
                                    'id-ID',
                                  )}
                                </span>
                              </div>
                              <p className="text-gray-700">{note.catatan}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Belum ada catatan
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatatan}
                          onChange={(e) => setNewCatatan(e.target.value)}
                          placeholder="Tambah catatan..."
                          className="flex-1 border rounded px-2 py-1 text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCatatan(sesi.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddCatatan(sesi.id)}
                          disabled={!newCatatan.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Kirim
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
