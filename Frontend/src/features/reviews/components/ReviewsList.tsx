import { useState } from 'react';
import { useMovieReviews } from '../hooks/reviewsQueries';
import { useAppSelector } from '../../../store';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface ReviewsListProps {
  movieId: string;
  movieTitle: string;
}

export default function ReviewsList({ movieId, movieTitle }: ReviewsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data, isLoading, isError } = useMovieReviews(movieId);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const reviews = data?.data ?? [];
  const total   = data?.total ?? 0;

  return (
    <section className="mt-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Reviews</h2>
          {total > 0 && (
            <span className="text-xs text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
              {total}
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Write Review
          </button>
        ) : (
          <p className="text-sm text-slate-500">
            <a href="/login" className="text-amber-400 hover:underline">Sign in</a> to write a review
          </p>
        )}
      </div>

      {/* ── Reviews list ── */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        {isLoading ? (
          // Skeleton
          <div className="divide-y divide-white/6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm">Failed to load reviews.</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-white font-medium text-sm">No reviews yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/6 px-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} movieId={movieId} />
            ))}
          </div>
        )}
      </div>

      {/* ── Review Form Modal ── */}
      <ReviewForm
        movieId={movieId}
        movieTitle={movieTitle}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </section>
  );
}
