import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../services/axios';
import type { Review, ApiResponse, PaginatedResponse } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'pending' | 'approved' | 'rejected';

// ─── API calls ────────────────────────────────────────────────────────────────
const fetchReviews = async (status: Tab, page: number) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Review>>>(
    `/v1/admin/reviews?status=${status}&page=${page}&limit=20`
  );
  return data.data;
};

const moderateReview = async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => {
  const { data } = await apiClient.patch(`/v1/admin/reviews/${id}/${action}`, { reason });
  return data;
};

const bulkModerate = async ({ ids, action }: { ids: string[]; action: 'approve' | 'reject' }) => {
  const { data } = await apiClient.post('/v1/admin/reviews/bulk', { ids, action });
  return data;
};

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(rating / 2) ? '#7c3aed' : 'rgba(255,255,255,0.15)', fontSize: 12 }}>★</span>
      ))}
      <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>{rating}/10</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', label: 'Pending'  },
  approved: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: 'Rejected' },
};

// ─── Rejection reason modal ───────────────────────────────────────────────────
function RejectModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: 400, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 12 }}>Rejection Reason</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain why this review is being rejected (optional)..."
          rows={3}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Reject</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<string | null>(null); // reviewId
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', tab, page],
    queryFn: () => fetchReviews(tab, page),
    placeholderData: prev => prev,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    setSelected(new Set());
  };

  const { mutate: moderate, isPending: isMod } = useMutation({
    mutationFn: moderateReview,
    onSuccess: (_, vars) => { toast.success(`Review ${vars.action}d`); invalidate(); },
    onError: () => toast.error('Action failed'),
  });

  const { mutate: bulk, isPending: isBulk } = useMutation({
    mutationFn: bulkModerate,
    onSuccess: (_, vars) => { toast.success(`${selected.size} reviews ${vars.action}d`); invalidate(); },
    onError: () => toast.error('Bulk action failed'),
  });

  const reviews = data?.data ?? [];
  const total   = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const allSelected = reviews.length > 0 && reviews.every(r => selected.has(r._id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(reviews.map(r => r._id)));
  };

  const TABS: { key: Tab; label: string; color: string }[] = [
    { key: 'pending',  label: 'Pending',  color: '#fbbf24' },
    { key: 'approved', label: 'Approved', color: '#34d399' },
    { key: 'rejected', label: 'Rejected', color: '#f87171' },
  ];

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: 0 }}>Review Moderation</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{total} reviews in this queue</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSelected(new Set()); }}
            style={{ padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === t.key ? t.color : '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12 }}>
          <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 500 }}>{selected.size} selected</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => bulk({ ids: Array.from(selected), action: 'approve' })} disabled={isBulk}
              style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#34d399', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              ✓ Approve All
            </button>
            <button onClick={() => setBulkRejectOpen(true)} disabled={isBulk}
              style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              ✗ Reject All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 100px 80px 120px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: '#7c3aed' }} />
          {['Review', 'Movie', 'Rating', 'Status', 'Actions'].map(h => (
            <span key={h} style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 100px 80px 120px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12, animation: 'pulse 1.5s infinite' }}>
              {[...Array(6)].map((__, j) => (
                <div key={j} style={{ height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
              ))}
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>No {tab} reviews</p>
          </div>
        ) : reviews.map(review => {
          const st = STATUS_STYLE[review.status] ?? STATUS_STYLE.pending;
          const isSelected = selected.has(review._id);
          return (
            <div key={review._id} onClick={() => toggleSelect(review._id)}
              style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 100px 80px 120px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'start', cursor: 'pointer', transition: 'background 0.1s', background: isSelected ? 'rgba(124,58,237,0.06)' : 'transparent' }}>

              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(review._id)}
                onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', accentColor: '#7c3aed', marginTop: 2 }} />

              {/* Review content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 500 }}>{review.userName}</span>
                </div>
                {review.content && (
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {review.content}
                  </p>
                )}
                {review.rejectionReason && (
                  <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>Reason: {review.rejectionReason}</p>
                )}
              </div>

              {/* Movie */}
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{review.movieTitle}</span>

              {/* Rating */}
              <Stars rating={review.rating} />

              {/* Status */}
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                {st.label}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                {review.status !== 'approved' && (
                  <button onClick={() => moderate({ id: review._id, action: 'approve' })} disabled={isMod}
                    title="Approve"
                    style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✓
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button onClick={() => setRejectTarget(review._id)} disabled={isMod}
                    title="Reject"
                    style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✗
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <span style={{ padding: '7px 16px', color: '#64748b', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      )}

      {/* Single reject modal */}
      {rejectTarget && (
        <RejectModal
          onConfirm={reason => { moderate({ id: rejectTarget, action: 'reject', reason }); setRejectTarget(null); }}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Bulk reject modal */}
      {bulkRejectOpen && (
        <RejectModal
          onConfirm={_reason => { bulk({ ids: Array.from(selected), action: 'reject' }); setBulkRejectOpen(false); }}
          onClose={() => setBulkRejectOpen(false)}
        />
      )}
    </div>
  );
}
