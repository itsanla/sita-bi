'use client';

import React, { useState, useEffect } from 'react';
import request from '@/lib/api';
import { CheckCircle, XCircle, Search, Loader, Info } from 'lucide-react';

// --- Interfaces ---
interface Submission {
  id: number;
  judul: string;
  tanggal_pengajuan: string;
  mahasiswa: {
    nim: string;
    user: {
      name: string;
    };
  };
}

// --- Main Page Component ---
export default function ValidasiTAPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await request<{ data: { data: Submission[] } }>(
        '/tugas-akhir/validasi',
      );
      if (Array.isArray(response.data?.data)) {
        setSubmissions(response.data.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch submissions');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this submission?')) return;
    try {
      await request(`/tugas-akhir/${id}/approve`, { method: 'PATCH' });
      alert('Submission approved!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await request(`/tugas-akhir/${id}/reject`, {
        method: 'PATCH',
        data: { alasan_penolakan: reason },
      });
      alert('Submission rejected!');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">
          Loading submissions...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Validasi Tugas Akhir
        </h1>
      </div>

      <div className="mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari berdasarkan judul atau nama mahasiswa..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="space-y-6">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {submission.judul}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Oleh:{' '}
                    <span className="font-semibold">
                      {submission.mahasiswa.user.name}
                    </span>{' '}
                    ({submission.mahasiswa.nim})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tanggal Pengajuan:{' '}
                    {new Date(
                      submission.tanggal_pengajuan,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(submission.id)}
                    className="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-sm"
                    title="Approve"
                  >
                    <CheckCircle className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleReject(submission.id)}
                    className="flex items-center justify-center w-10 h-10 bg-red-700 text-white rounded-full hover:bg-red-800 transition-colors duration-200 shadow-sm"
                    title="Reject"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 bg-white p-12 rounded-lg shadow-md">
            <Info size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold">Tidak Ada Pengajuan</h2>
            <p className="mt-1">
              Saat ini tidak ada pengajuan tugas akhir yang memerlukan validasi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
