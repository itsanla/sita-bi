import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // In production, set this to the specific frontend URL
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000, // 30 seconds
    pingInterval: 25000, // 25 seconds
    connectTimeout: 45000, // 45 seconds
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.warn('A user connected:', socket.id);

    // Set socket timeout
    const socketTimeout = setTimeout(() => {
      console.warn(`Socket ${socket.id} idle timeout - disconnecting`);
      socket.disconnect(true);
    }, 300000); // 5 minutes idle timeout

    socket.on('join', (userId: string) => {
      console.warn(`User ${userId} joined room user_${userId}`);
      void socket.join(`user_${userId}`);
      // Reset timeout on activity
      clearTimeout(socketTimeout);
    });

    socket.on('disconnect', () => {
      console.warn('User disconnected:', socket.id);
      clearTimeout(socketTimeout);
    });

    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
      clearTimeout(socketTimeout);
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer | null => {
  if (io == null) {
    // console.warn('Socket.io is not initialized!');
    // Throwing error might crash if called before initialization, handle gracefully or ensure init first
  }
  return io;
};
