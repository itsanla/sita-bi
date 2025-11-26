'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { CheckCircle, XCircle, Loader, Info } from 'lucide-react';

// --- Interfaces ---
interface Registration {
  id: number;
  status_pembimbing_1: string;
  status_pembimbing_2: string;
  tugasAkhir: {
    judul: string;
    mahasiswa: {
      user: { name: string };
    };
  };
}

// --- Main Page Component ---
export default function SidangApprovalsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await request<{ data: Registration[] }>(
        '/pendaftaran-sidang/pending-approvals',
      );
      if (Array.isArray(data.data)) {
        setRegistrations(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this registration?')) return;
    try {
      await request(`/pendaftaran-sidang/${id}/approve`, { method: 'POST' });
      alert('Registration approved!');
      fetchData(); // Refresh list
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`,
      );
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await request(`/pendaftaran-sidang/${id}/reject`, {
        method: 'POST',
        data: { catatan: reason },
      });
      alert('Registration rejected!');
      fetchData(); // Refresh list
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">Loading data...</span>
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
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Persetujuan Pendaftaran Sidang
      </h1>

      {registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 p-12 rounded-lg">
          <Info size={48} className="mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold">Tidak Ada Pendaftaran</h2>
          <p className="mt-1">
            Saat ini tidak ada pengajuan pendaftaran sidang yang memerlukan
            persetujuan Anda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Mahasiswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul Tugas Akhir
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reg.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {reg.tugasAkhir.mahasiswa.user.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {reg.tugasAkhir.judul}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleApprove(reg.id)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Setuju
                    </button>
                    <button
                      onClick={() => handleReject(reg.id)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                    >
                      <XCircle size={16} className="mr-2" />
                      Tolak
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
