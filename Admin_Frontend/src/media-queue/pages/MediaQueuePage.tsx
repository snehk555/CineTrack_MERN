import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../services/axios';
import type { ApiResponse } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

interface MediaJob {
  id: string;
  name: string;
  data: { movieId?: string; movieTitle?: string; filename?: string };
  status: JobStatus;
  progress: number;
  failedReason?: string;
  attemptsMade: number;
  attemptsMax: number;
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchQueue = async (status: JobStatus | 'all', page: number) => {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (status !== 'all') params.set('status', status);
  const { data } = await apiClient.get<ApiResponse<{ jobs: MediaJob[]; stats: QueueStats; total: number; totalPages: number }>>(
    `/v1/admin/media-queue?${params.toString()}`
  );
  return data.data;
};

const retryJob = async (jobId: string) => {
  const { data } = await apiClient.post(`/v1/admin/media-queue/${jobId}/retry`);
  return data;
};

const clearFailed = async () => {
  const { data } = await apiClient.delete('/v1/admin/media-queue/failed');
  return data;
};

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<JobStatus, { bg: string; color: string; dot: string }> = {
  waiting:   { bg: 'rgba(100,116,139,0.12)',  color: '#94a3b8', dot: '#64748b' },
  active:    { bg: 'rgba(59,130,246,0.12)',   color: '#60a5fa', dot: '#3b82f6' },
  completed: { bg: 'rgba(16,185,129,0.12)',   color: '#34d399', dot: '#10b981' },
  failed:    { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', dot: '#ef4444' },
  delayed:   { bg: 'rgba(245,158,11,0.12)',   color: '#fbbf24', dot: '#f59e0b' },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', minWidth: 80 }}>
      <div style={{ height: '100%', width: `${value}%`, background: value === 100 ? '#10b981' : '#7c3aed', borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MediaQueuePage() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'media-queue', statusFilter, page],
    queryFn:  () => fetchQueue(statusFilter, page),
    refetchInterval: 10000, // auto-refresh every 10s for active jobs
    placeholderData: prev => prev,
  });

  const { mutate: retry, isPending: isRetrying } = useMutation({
    mutationFn: retryJob,
    onSuccess: () => { toast.success('Job queued for retry'); qc.invalidateQueries({ queryKey: ['admin', 'media-queue'] }); },
    onError: () => toast.error('Retry failed'),
  });

  const { mutate: clearAll, isPending: isClearing } = useMutation({
    mutationFn: clearFailed,
    onSuccess: () => { toast.success('Failed jobs cleared'); qc.invalidateQueries({ queryKey: ['admin', 'media-queue'] }); },
    onError: () => toast.error('Clear failed'),
  });

  const stats      = data?.stats;
  const jobs       = data?.jobs ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const STAT_CARDS = [
    { key: 'active',    label: 'Processing', color: '#60a5fa' },
    { key: 'waiting',   label: 'Waiting',    color: '#94a3b8' },
    { key: 'completed', label: 'Completed',  color: '#34d399' },
    { key: 'failed',    label: 'Failed',     color: '#f87171' },
    { key: 'delayed',   label: 'Delayed',    color: '#fbbf24' },
  ] as const;

  const TABS: { key: JobStatus | 'all'; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Active' },
    { key: 'waiting',   label: 'Waiting' },
    { key: 'failed',    label: 'Failed' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Media Queue</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>BullMQ job monitor — auto-refreshes every 10s</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => refetch()}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ↻ Refresh
          </button>
          {(stats?.failed ?? 0) > 0 && (
            <button onClick={() => clearAll()} disabled={isClearing}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              {isClearing ? 'Clearing...' : `Clear ${stats?.failed} Failed`}
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {STAT_CARDS.map(sc => (
          <div key={sc.key} onClick={() => { setStatusFilter(sc.key); setPage(1); }}
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${statusFilter === sc.key ? sc.color + '50' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border 0.15s' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: sc.color }}>{stats?.[sc.key] ?? '—'}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sc.label}</div>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setStatusFilter(t.key); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: 9, border: 'none', background: statusFilter === t.key ? 'rgba(255,255,255,0.1)' : 'transparent', color: statusFilter === t.key ? '#f8fafc' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px 100px', padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Job', 'Status', 'Progress', 'Attempts', 'Actions'].map(h => (
            <span key={h} style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px 100px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
              {[...Array(5)].map((__, j) => <div key={j} style={{ height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />)}
            </div>
          ))
        ) : jobs.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>No {statusFilter === 'all' ? '' : statusFilter} jobs</p>
          </div>
        ) : jobs.map(job => {
          const st = STATUS_STYLE[job.status];
          return (
            <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px 100px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              {/* Job info */}
              <div>
                <p style={{ color: '#f8fafc', fontSize: 13, fontWeight: 500, margin: '0 0 3px' }}>
                  {job.data.movieTitle ?? job.data.filename ?? job.name}
                </p>
                {job.failedReason && (
                  <p style={{ color: '#f87171', fontSize: 11, margin: 0 }} title={job.failedReason}>
                    ✗ {job.failedReason.slice(0, 60)}{job.failedReason.length > 60 ? '...' : ''}
                  </p>
                )}
                <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0' }}>
                  {new Date(job.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, animation: job.status === 'active' ? 'pulse 1.5s infinite' : 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: st.color }}>{job.status}</span>
              </div>

              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ProgressBar value={job.progress} />
                <span style={{ color: '#64748b', fontSize: 11, minWidth: 28 }}>{job.progress}%</span>
              </div>

              {/* Attempts */}
              <span style={{ color: job.attemptsMade >= job.attemptsMax ? '#f87171' : '#94a3b8', fontSize: 12 }}>
                {job.attemptsMade}/{job.attemptsMax}
              </span>

              {/* Actions */}
              <div>
                {job.status === 'failed' && (
                  <button onClick={() => retry(job.id)} disabled={isRetrying}
                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(124,58,237,0.15)', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                    ↻ Retry
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
            ← Prev
          </button>
          <span style={{ color: '#475569', fontSize: 13 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
            Next →
          </button>
        </div>
      )}
      <p style={{ textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 12 }}>Total: {total} jobs</p>
    </div>
  );
}
