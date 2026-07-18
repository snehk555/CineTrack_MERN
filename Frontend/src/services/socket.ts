import { io, Socket } from 'socket.io-client';

// ─── Event Types (mirrors backend SocketEventName) ────────────────────────────
export type SocketEventName =
  | 'notification:new'
  | 'movie:added'
  | 'video:processed'
  | 'video:progress'
  | 'user:banned'
  | 'subscription:activated'
  | 'pong';

export interface NotificationPayload {
  _id: string;
  type: 'review_liked' | 'movie_added' | 'video_ready' | 'subscription' | 'banned';
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface VideoProgressPayload {
  jobId: string;
  movieId: string;
  percent: number;
}

// ─── Singleton Socket Instance ────────────────────────────────────────────────
let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';

// ─── Connect (call after login / on app init if token exists) ────────────────
export const connectSocket = (userId?: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,          // sends HTTP-only JWT cookie automatically
    transports: ['websocket', 'polling'],
    query: userId ? { userId } : {}, // optional hint for logging
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.info('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.info('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
};

// ─── Disconnect (call on logout) ──────────────────────────────────────────────
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.info('[Socket] Disconnected by client');
  }
};

// ─── Get current instance (nullable) ─────────────────────────────────────────
export const getSocket = (): Socket | null => socket;
