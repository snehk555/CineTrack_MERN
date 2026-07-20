import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/axios';
import type { AuditLog, ApiResponse, PaginatedResponse } from '../../types';

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchAuditLogs = async (page: number, action: string, search: string) => {
  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (action) params.set('action', action);
  if (search) params.set('search', search);
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
    `/v1/admin/audit-logs?${params.toString()}`
  );
  return data.data;
};

// ─── Action badge color map ───────────────────────────────────────────────────
const ACTION_COLOR: Record<string, { bg: string; color: string; icon: string }> = {
  USER_BANNED:          { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', icon: '⛔' },
  USER_SUSPENDED:       { bg: 'rgba(245,158,11,0.12)',   color: '#fbbf24', icon: '⏸' },
  USER_PROMOTED:        { bg: 'rgba(16,185,129,0.12)',   color: '#34d399', icon: '⬆' },
  USER_ROLE_CHANGED:    { bg: 'rgba(59,130,246,0.12)',   color: '#60a5fa', icon: '🔄' },
  USER_PLAN_CHANGED:    { bg: 'rgba(168,85,247,0.12)',   color: '#c084fc', icon: '👑' },
  USER_IMPERSONATED:    { bg: 'rgba(236,72,153,0.12)',   color: '#f472b6', icon: '🎭' },
  USER_DATA_EXPORTED:   { bg: 'rgba(255,255,255,0.06)',  color: '#94a3b8', icon: '📤' },
  MOVIE_PUBLISHED:      { bg: 'rgba(16,185,129,0.12)',   color: '#34d399', icon: '🎬' },
  MOVIE_DELETED:        { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', icon: '🗑' },
  REVIEW_APPROVED:      { bg: 'rgba(16,185,129,0.12)',   color: '#34d399', icon: '✓' },
  REVIEW_REJECTED:      { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', icon: '✗' },
  GENRE_CREATED:        { bg: 'rgba(124,58,237,0.12)',   color: '#a78bfa', icon: '🏷' },
  GENRE_DELETED:        { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', icon: '🏷' },
  FEATURE_FLAG_TOGGLED: { bg: 'rgba(245,158,11,0.12)',   color: '#fbbf24', icon: '🚩' },
  PLAN_PRICE_CHANGED:   { bg: 'rgba(168,85,247,0.12)',   color: '#c084fc', icon: '💰' },
  ADMIN_LOGIN:          { bg: 'rgba(16,185,129,0.12)',   color: '#34d399', icon: '🔑' },
  ADMIN_LOGIN_FAILED:   { bg: 'rgba(239,68,68,0.12)',    color: '#f87171', icon: '🔒' },
  ADMIN_LOGOUT:         { bg: 'rgba(255,255,255,0.06)',  color: '#64748b', icon: '🚪' },
};

const DEFAULT_COLOR = { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8', icon: '📋' };

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const ACTION_OPTIONS = [
  'USER_BANNED', 'USER_SUSPENDED', 'USER_PROMOTED', 'USER_ROLE_CHANGED',
  'USER_PLAN_CHANGED', 'USER_IMPERSONATED', 'MOVIE_PUBLISHED', 'MOVIE_DELETED',
  'REVIEW_APPROVED', 'REVIEW_REJECTED', 'GENRE_CREATED', 'GENRE_DELETED',
  'FEATURE_FLAG_TOGGLED', 'PLAN_PRICE_CHANGED', 'ADMIN_LOGIN', 'ADMIN_LOGIN_FAILED',
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const [page, setPage]     = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, action, search],
    queryFn:  () => fetchAuditLogs(page, action, search),
    placeholderData: prev => prev,
  });

  const logs       = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Audit Logs</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{total} total actions recorded</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search admin name..."
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: 13, outline: 'none', width: 220 }}
        />
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0f0f17', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        {(action || search) && (
          <button onClick={() => { setAction(''); setSearch(''); setPage(1); }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Timeline list */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start', animation: 'pulse 1.5s infinite' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '60%', marginBottom: 8 }} />
                <div style={{ height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, width: '40%' }} />
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>No audit logs found</p>
          </div>
        ) : logs.map(log => {
          const style = ACTION_COLOR[log.action] ?? DEFAULT_COLOR;
          return (
            <div key={log._id} style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'flex-start' }}>
              {/* Icon circle */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: style.bg, border: `1px solid ${style.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1,
              }}>
                {style.icon}
              </div>

              {/* Content card */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{log.adminName}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, letterSpacing: '0.03em' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.targetName && (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>→ {log.targetName}</span>
                    )}
                  </div>
                  <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>{relativeTime(log.createdAt)}</span>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(log.metadata).slice(0, 4).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 }}>
                        {k}: <span style={{ color: '#94a3b8' }}>{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
                {log.ipAddress && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569' }}>IP: {log.ipAddress}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
            ← Prev
          </button>
          <span style={{ color: '#475569', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
