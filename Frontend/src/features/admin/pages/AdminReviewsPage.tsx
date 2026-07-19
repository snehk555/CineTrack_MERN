import { useState } from 'react';
import { useAdminReviews, useApproveReviewMutation, useRejectReviewMutation } from '../hooks/adminQueries';
import type { ReviewWithDetails } from '../hooks/adminQueries';

const TABS = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'approved', label: 'Approved', icon: '✅' },
  { key: 'rejected', label: 'Rejected', icon: '❌' },
] as const;

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { data, isLoading } = useAdminReviews(activeTab);
  const { mutate: approveReview, isPending: approving } = useApproveReviewMutation();
  const { mutate: rejectReview, isPending: rejecting } = useRejectReviewMutation();

  const reviews: ReviewWithDetails[] = data?.reviews ?? [];
  const isPending = approving || rejecting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-slate-400 text-sm mt-0.5">Moderate user reviews</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === tab.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.key === 'pending' && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {data?.total ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/5 border border-white/8 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">
            {activeTab === 'pending' ? '✅' : activeTab === 'approved' ? '🎉' : '🗑️'}
          </p>
          <p className="text-white font-medium">
            {activeTab === 'pending' ? 'No pending reviews!' : `No ${activeTab} reviews`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white/5 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">

                {/* Left: Movie + User info */}
                <div className="flex items-start gap-4 min-w-0">
                  {review.movieId?.posterPath && (
                    <img
                      src={review.movieId.posterPath}
                      alt={review.movieId.title}
                      className="w-8 h-12 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{review.movieId?.title}</p>
                    <p className="text-slate-400 text-xs">by {review.userId?.name} · {new Date(review.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400 text-xs font-bold">⭐ {review.rating}/10</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed line-clamp-3">{review.comment}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                {activeTab === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approveReview(review._id)}
                      disabled={isPending}
                      className="px-4 py-2 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-colors disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => rejectReview(review._id)}
                      disabled={isPending}
                      className="px-4 py-2 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl transition-colors disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {activeTab === 'approved' && (
                  <span className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                    ✓ Approved
                  </span>
                )}

                {activeTab === 'rejected' && (
                  <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-xl">
                    ✕ Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
