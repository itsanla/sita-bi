'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen } from 'lucide-react';

export default function QuickActions() {
  const [systemStats, setSystemStats] = useState({
    totalDosen: 0,
    totalMahasiswa: 0,
    totalJudulTA: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const userId =
          localStorage.getItem('userId') || localStorage.getItem('token');

        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          'http://localhost:3002/api/dashboard/mahasiswa/system-stats',
          {
            headers: {
              'x-user-id': userId,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result.data)) {
            setSystemStats(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();
  }, []);

  const stats = [
    {
      title: 'Jumlah Dosen',
      value: systemStats.totalDosen,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Jumlah Mahasiswa',
      value: systemStats.totalMahasiswa,
      icon: GraduationCap,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Jumlah Judul TA',
      value: systemStats.totalJudulTA,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Statistik Sistem</h3>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="group relative p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              ></div>

              {/* Content */}
              <div className="relative">
                <div
                  className={`${stat.iconBg} p-3 rounded-xl inline-flex group-hover:scale-110 transition-transform duration-300 mb-4`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>

                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {stat.value}
                </p>
              </div>

              {/* Bottom accent */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
