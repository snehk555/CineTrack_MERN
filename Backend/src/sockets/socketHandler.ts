import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ─── Socket Event Types ───────────────────────────────────────────────────────
export type SocketEventName =
  | 'notification:new'
  | 'movie:added'
  | 'video:processed'
  | 'video:progress'
  | 'user:banned'
  | 'subscription:activated';

// ─── Augmented Socket ─────────────────────────────────────────────────────────
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

// ─── Module-level io instance (exported for use in other modules) ─────────────
let io: Server;

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized — call initializeSocket first');
  return io;
};

// ─── Helper: emit to a specific user ─────────────────────────────────────────
export const emitToUser = (userId: string, event: SocketEventName, data: unknown): void => {
  getIO().to(`user:${userId}`).emit(event, data);
};

// ─── Helper: emit to all admins ───────────────────────────────────────────────
export const emitToAdmins = (event: SocketEventName, data: unknown): void => {
  getIO().to('admin:room').emit(event, data);
};

// ─── Initialize Socket Server ─────────────────────────────────────────────────
export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ─── Auth Middleware ──────────────────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      // Fallback to cookie if no auth/bearer token found
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').map(c => c.trim());
        const accessCookie = cookies.find(c => c.startsWith('accessToken='));
        if (accessCookie) token = accessCookie.split('=')[1];
      }

      if (!token) {
        // Allow unauthenticated connections (for public pages)
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };
      socket.user = { id: decoded.userId, role: decoded.role };
      next();
    } catch {
      // Invalid token — connect as guest, not disconnect
      next();
    }
  });

  // ─── Connection Handler ───────────────────────────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;

    if (userId) {
      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);
      logger.info(`Socket connected: user=${userId}`);

      // Admin gets admin room as well
      if (userRole === 'admin') {
        socket.join('admin:room');
        logger.info(`Admin socket joined admin:room: user=${userId}`);
      }
    } else {
      logger.info(`Socket connected: guest (${socket.id})`);
    }

    // ─── Client Events ──────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${userId ?? 'guest'} — reason: ${reason}`);
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  logger.info('Socket.io initialized');
  return io;
};
