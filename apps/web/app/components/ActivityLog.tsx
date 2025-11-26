'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api';
import { Loader, Clock, Activity } from 'lucide-react';

interface Log {
  id: number;
  action: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await request<{ data: { data: Log[] } }>('/log/me?limit=10');
      const logsData = res?.data?.data?.data;
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <Activity size={20} className="mr-2 text-blue-600" />
        Aktivitas Terkini
      </h3>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader className="animate-spin text-gray-400" size={24} />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada aktivitas tercatat.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-0"
            >
              <p className="text-sm text-gray-700 font-medium">{log.action}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1 sm:mt-0">
                <Clock size={12} className="mr-1" />
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
