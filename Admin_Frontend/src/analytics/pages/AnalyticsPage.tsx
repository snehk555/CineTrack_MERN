import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/axios';
import type { ApiResponse } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  totalReviews: number;
  totalWatchlists: number;
  newUsersToday: number;
  newUsersTrend: number; // % vs yesterday
  revenueThisMonth: number; // paise
  revenueTrend: number;
}

interface GenrePopularity { genre: string; count: number; percentage: number }
interface DailySignup     { date: string; count: number }
interface TopMovie        { _id: string; title: string; watchlistCount: number; avgRating: number }
interface PlanDistribution { plan: string; count: number; percentage: number }

// ─── API ──────────────────────────────────────────────────────────────────────
const period = (days: number) => `?days=${days}`;
const fetchOverview  = (days: number) => apiClient.get<ApiResponse<OverviewStats>>(`/v1/admin/analytics/overview${period(days)}`).then(r => r.data.data);
const fetchGenres    = (days: number) => apiClient.get<ApiResponse<GenrePopularity[]>>(`/v1/admin/analytics/genres${period(days)}`).then(r => r.data.data);
const fetchSignups   = (days: number) => apiClient.get<ApiResponse<DailySignup[]>>(`/v1/admin/analytics/signups${period(days)}`).then(r => r.data.data);
const fetchTopMovies = (days: number) => apiClient.get<ApiResponse<TopMovie[]>>(`/v1/admin/analytics/top-movies${period(days)}`).then(r => r.data.data);
const fetchPlans     = ()              => apiClient.get<ApiResponse<PlanDistribution[]>>('/v1/admin/analytics/plans').then(r => r.data.data);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('en-IN'); }
function fmtRupee(paise: number | undefined) { return `₹${((paise ?? 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`; }
function trend(val: number) {
  if (val === 0) return { color: '#64748b', sign: '' };
  return val > 0 ? { color: '#34d399', sign: '+' } : { color: '#f87171', sign: '' };
}

// ─── Mini sparkline bars ──────────────────────────────────────────────────────
function SparkBar({ data }: { data: DailySignup[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
      {data.slice(-20).map((d, i) => (
        <div key={i} title={`${d.date}: ${d.count}`}
          style={{ flex: 1, background: '#7c3aed', borderRadius: '2px 2px 0 0', height: `${(d.count / max) * 100}%`, minHeight: 2, opacity: 0.7 + (i / data.length) * 0.3 }} />
      ))}
    </div>
  );
}

// ─── Horizontal bar chart ─────────────────────────────────────────────────────
function HBar({ label, percentage, color = '#7c3aed', subLabel }: { label: string; percentage: number; color?: string; subLabel?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600 }}>{subLabel ?? `${percentage.toFixed(1)}%`}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${Math.min(percentage, 100)}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trendVal, icon }: { label: string; value: string; sub?: string; trendVal?: number; icon: string }) {
  const t = trendVal !== undefined ? trend(trendVal) : null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {t && trendVal !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, color: t.color }}>
            {t.sign}{trendVal.toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: overview }  = useQuery({ queryKey: ['admin', 'analytics', 'overview', days],  queryFn: () => fetchOverview(days)  });
  const { data: genres = [] } = useQuery({ queryKey: ['admin', 'analytics', 'genres', days],  queryFn: () => fetchGenres(days)    });
  const { data: signups = [] } = useQuery({ queryKey: ['admin', 'analytics', 'signups', days], queryFn: () => fetchSignups(days)   });
  const { data: topMovies = [] } = useQuery({ queryKey: ['admin', 'analytics', 'top-movies', days], queryFn: () => fetchTopMovies(days) });
  const { data: plans = [] }  = useQuery({ queryKey: ['admin', 'analytics', 'plans'],          queryFn: fetchPlans                  });

  const PLAN_COLORS: Record<string, string> = { free: '#64748b', premium: '#7c3aed', pro: '#f59e0b' };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Analytics</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Platform performance overview</p>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: '6px 14px', borderRadius: 9, border: 'none', background: days === d ? 'rgba(255,255,255,0.1)' : 'transparent', color: days === d ? '#f8fafc' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard icon="👥" label="Total Users"      value={fmt(overview?.totalUsers)}      trendVal={overview?.newUsersTrend} />
        <KpiCard icon="🎬" label="Total Movies"     value={fmt(overview?.totalMovies)}      />
        <KpiCard icon="💬" label="Total Reviews"    value={fmt(overview?.totalReviews)}     />
        <KpiCard icon="💰" label="Revenue (Month)"  value={fmtRupee(overview?.revenueThisMonth)} trendVal={overview?.revenueTrend} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard icon="🔥" label="Active Users"     value={fmt(overview?.activeUsers)}      sub="Last 30 days" />
        <KpiCard icon="📋" label="Watchlists"       value={fmt(overview?.totalWatchlists)}  />
        <KpiCard icon="🆕" label="New Users Today"  value={fmt(overview?.newUsersToday)}    />
      </div>

      {/* 2-col charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Signups chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Daily Signups</p>
          {signups.length ? <SparkBar data={signups} /> : <p style={{ color: '#475569', fontSize: 12 }}>No data</p>}
          <p style={{ color: '#475569', fontSize: 11, margin: '8px 0 0', textAlign: 'right' }}>Last {days} days</p>
        </div>

        {/* Plan distribution */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Subscription Plans</p>
          {plans.length ? plans.map(p => (
            <HBar key={p.plan} label={p.plan.toUpperCase()} percentage={p.percentage} color={PLAN_COLORS[p.plan] ?? '#7c3aed'} subLabel={`${fmt(p.count)} users (${p.percentage.toFixed(1)}%)`} />
          )) : <p style={{ color: '#475569', fontSize: 12 }}>No data</p>}
        </div>
      </div>

      {/* 2-col charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Genre popularity */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Top Genres</p>
          {genres.slice(0, 8).map(g => (
            <HBar key={g.genre} label={g.genre} percentage={g.percentage} color="#a78bfa" subLabel={`${fmt(g.count)} movies`} />
          ))}
        </div>

        {/* Top movies */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Top Movies by Watchlist</p>
          {topMovies.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 12 }}>No data</p>
          ) : topMovies.slice(0, 8).map((m, i) => (
            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ color: '#475569', fontSize: 11, width: 16, flexShrink: 0 }}>#{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#f8fafc', fontSize: 12, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
              </div>
              <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0 }}>⭐ {m.avgRating.toFixed(1)}</span>
              <span style={{ color: '#94a3b8', fontSize: 11, flexShrink: 0 }}>📋 {fmt(m.watchlistCount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
