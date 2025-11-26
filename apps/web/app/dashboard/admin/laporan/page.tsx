'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalStudents: number;
  totalLecturers: number;
  activeTAs: number;
}

interface Workload {
  dosen_id: number;
  name: string;
  roles: { role: string; count: number }[];
}

export default function LaporanPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [workload, setWorkload] = useState<Workload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const [statsRes, workloadRes] = await Promise.all([
          fetch(`${apiUrl}/api/reports/dashboard`, { headers }),
          fetch(`${apiUrl}/api/reports/workload`, { headers }),
        ]);

        const statsData = await statsRes.json();
        const workloadData = await workloadRes.json();

        if (statsData.status === 'success')
          if (Array.isArray(statsData.data)) {
            setStats(statsData.data);
          }
        if (workloadData.status === 'success')
          if (Array.isArray(workloadData.data)) {
            setWorkload(workloadData.data);
          }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading reports...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">System Reports</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-700">
            Total Students
          </h3>
          <p className="text-3xl font-bold text-blue-900">
            {stats?.totalStudents}
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
          <h3 className="text-lg font-semibold text-green-700">
            Total Lecturers
          </h3>
          <p className="text-3xl font-bold text-green-900">
            {stats?.totalLecturers}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-100">
          <h3 className="text-lg font-semibold text-purple-700">
            Active Final Projects
          </h3>
          <p className="text-3xl font-bold text-purple-900">
            {stats?.activeTAs}
          </p>
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Lecturer Workload</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lecturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles Breakdown
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Mentored
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {workload.map((dosen) => {
              const total = dosen.roles.reduce(
                (acc, curr) => acc + curr.count,
                0,
              );
              return (
                <tr key={dosen.dosen_id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {dosen.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dosen.roles.map((r) => (
                      <span
                        key={r.role}
                        className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-2 mb-1"
                      >
                        {r.role}: {r.count}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
