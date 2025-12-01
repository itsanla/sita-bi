'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../../../../hooks/useSocket';
// import { useAuth } from "../../../context/AuthContext"; // Assuming you have AuthContext

interface Notification {
  subject: string;
  message: string;
  createdAt: string;
}

interface HistoryItem {
  id: number;
  sent_at: string;
  channel: string;
  subject: string;
  message: string;
  status: string;
}

export default function NotificationsPage() {
  // const { user } = useAuth();
  // Mock user for now, replace with real user from context
  const user = { id: 1, name: 'Mahasiswa Test' };

  const socket = useSocket(user.id);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is in localStorage
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/history`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data as HistoryItem[]);
      }
    } catch (error) {
      console.warn('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('notification', (data: Notification) => {
        console.warn('New notification:', data);
        setNotifications((prev) => [data, ...prev]);
        // Also refresh history if needed
        void fetchHistory();
      });
    }
  }, [socket]);

  useEffect(() => {
    void fetchHistory();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sistem Notifikasi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">
            Notifikasi Real-time (Live)
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500">
              Belum ada notifikasi baru sejak Anda membuka halaman ini.
            </p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notif, idx) => (
                <li key={idx} className="border p-2 rounded bg-blue-50">
                  <p className="font-bold">{notif.subject}</p>
                  <p>{notif.message}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Riwayat Notifikasi</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Channel</th>
                    <th className="p-2">Pesan</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {new Date(item.sent_at).toLocaleString()}
                      </td>
                      <td className="p-2">{item.channel}</td>
                      <td className="p-2">
                        <div className="font-medium">{item.subject}</div>
                        <div className="text-gray-600 truncate max-w-xs">
                          {item.message}
                        </div>
                      </td>
                      <td
                        className={`p-2 font-semibold ${item.status === 'SENT' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        Tidak ada riwayat notifikasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
