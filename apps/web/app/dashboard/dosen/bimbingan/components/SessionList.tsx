// apps/web/app/dashboard/dosen/bimbingan/components/SessionList.tsx
import React from 'react';
import { BimbinganSession } from '../types';
import SessionCard from './SessionCard';

interface SessionListProps {
  sessions: BimbinganSession[];
}

export default function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <p className="text-gray-500 mt-4">Belum ada sesi bimbingan.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
