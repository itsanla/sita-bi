'use client';

import { useEffect, useState } from 'react';
import io, { type Socket } from 'socket.io-client';

// You should replace this with the actual user ID from your auth context
// For now, we will rely on the parent component or context to pass it or set it
export const useSocket = (userId: number | undefined): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    );

    socketInstance.on('connect', () => {
      // console.warn("Connected to socket server");
      socketInstance.emit('join', userId.toString());
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return socket;
};
