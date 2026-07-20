import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector, clearUnread } from '../../../store';
import apiClient from '../../../services/axios';
import type { NotificationPayload } from '../../../services/socket';

const TYPE_ICON: Record<string, string> = {
  review_liked:   '❤️',
  movie_added:    '🎬',
  video_ready:    '✅',
  subscription:   '👑',
  banned:         '⛔',
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unreadCount = useAppSelector((state) => state.ui.unreadNotifications);

  const { data: notifications } = useQuery<NotificationPayload[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/notifications');
      return data.data;
    },
    enabled: open, // Only fetch when dropdown is open
    staleTime: 0,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => apiClient.patch('/v1/notifications/mark-all-read'),
    onSuccess: () => {
      dispatch(clearUnread());
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleOpen = () => {
    setOpen((p) => !p);
    if (!open && unreadCount > 0) {
      // Clear badge immediately on open (optimistic)
      dispatch(clearUnread());
      markAllRead();
    }
  };

  const handleNotificationClick = (notification: NotificationPayload) => {
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative text-slate-400 hover:text-white transition-colors p-1"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute top-10 right-0 w-80 bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount === 0 && notifications && notifications.length > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">🔕</p>
                  <p className="text-slate-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-left ${
                      !n.read ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs leading-relaxed">{n.message}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
