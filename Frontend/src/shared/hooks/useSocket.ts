import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SocketEventName, NotificationPayload, VideoProgressPayload } from '../../services/socket';
import { useAppDispatch } from '../../store';
import { incrementUnread, clearUser } from '../../store';

// ─── Generic socket event hook (with cleanup) ──────────────────────────────
export function useSocketEvent<T = unknown>(
  event: SocketEventName,
  handler: (data: T) => void,
) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(event, handler as (...args: unknown[]) => void);
    return () => {
      socket.off(event, handler as (...args: unknown[]) => void);
    };
  }, [event, handler]);
}

// ─── Notification listener ─────────────────────────────────────────────────
export function useNotifications() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useSocketEvent<NotificationPayload>('notification:new', (data) => {
    // Increment bell badge count in Redux
    dispatch(incrementUnread());

    // Invalidate notifications query so dropdown refreshes
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Log for now — Phase 17 adds toast notification
    console.info('[Notification]', data.message);
  });
}

// ─── Force logout on ban event ─────────────────────────────────────────────
export function useBanListener() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useSocketEvent<{ reason: string }>('user:banned', (_data) => {
    queryClient.clear();
    dispatch(clearUser());
    // User will be redirected by ProtectedRoute automatically
  });
}

// ─── Video processing progress ─────────────────────────────────────────────
export function useVideoProgress(
  movieId: string,
  onProgress: (percent: number) => void,
) {
  useSocketEvent<VideoProgressPayload>('video:progress', (data) => {
    if (data.movieId === movieId) {
      onProgress(data.percent);
    }
  });

  useSocketEvent<VideoProgressPayload>('video:processed', (data) => {
    if (data.movieId === movieId) {
      onProgress(100);
    }
  });
}

// ─── Admin: movie added realtime ───────────────────────────────────────────
export function useAdminMovieEvents() {
  const queryClient = useQueryClient();

  useSocketEvent('movie:added', () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  });
}
