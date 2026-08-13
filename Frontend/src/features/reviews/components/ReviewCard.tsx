import type { Review, User } from '../../../types';
import { useAppSelector } from '../../../store';
import { useDeleteReview } from '../hooks/reviewsQueries';



// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
    );
  }
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-amber-600/20 border border-amber-500/25 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

// ─── RelativeTime ─────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────
interface ReviewCardProps {
  review: Review;
  movieId: string;
}

export default function ReviewCard({ review, movieId }: ReviewCardProps) {
  const currentUser = useAppSelector((s) => s.auth.user);
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview(movieId);

  const reviewer = typeof review.userId === 'object' ? (review.userId as User) : null;
  let name     = reviewer?.name ?? 'Anonymous';
  if (name.toLowerCase() === 'admin') name = 'CineTrack User';
  const avatar   = reviewer?.avatarUrl;
  const isOwner  = currentUser && reviewer && currentUser._id === reviewer._id;

  return (
    <div className="flex gap-3 py-4 border-b border-white/6 last:border-0 group">
      <Avatar name={name} avatarUrl={avatar} />

      <div className="flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white leading-none">{name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">{relativeTime(review.createdAt)}</span>
            {isOwner && (
              <button
                onClick={() => deleteReview(review._id)}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded-lg hover:bg-red-500/10"
              >
                {isDeleting ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}
