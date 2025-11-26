import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // In production, set this to the specific frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.warn('A user connected:', socket.id);

    socket.on('join', (userId: string) => {
      console.warn(`User ${userId} joined room user_${userId}`);
      void socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.warn('User disconnected:', socket.id);
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
