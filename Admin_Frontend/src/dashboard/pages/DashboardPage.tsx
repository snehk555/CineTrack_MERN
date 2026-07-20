import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dashboardApi } from '@/dashboard/services/dashboardApi';
import './DashboardPage.css';

// ─── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: string;
  label: string;
  value: number | string;
  delta?: number;
  loading?: boolean;
}

const KpiCard = ({ icon, label, value, delta, loading }: KpiCardProps) => (
  <div className="kpi-card">
    <div className="kpi-card__top">
      <span className="kpi-card__icon">{icon}</span>
      <span className="kpi-card__label">{label}</span>
    </div>
    {loading ? (
      <div className="kpi-card__skeleton" />
    ) : (
      <>
        <div className="kpi-card__value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {delta !== undefined && (
          <div className={`kpi-card__delta ${delta >= 0 ? 'kpi-card__delta--up' : 'kpi-card__delta--down'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} vs yesterday
          </div>
        )}
      </>
    )}
  </div>
);

// ─── Action Badge ─────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  ADMIN_LOGIN:        'var(--success)',
  USER_BANNED:        'var(--danger)',
  USER_SUSPENDED:     'var(--warning)',
  MOVIE_PUBLISHED:    'var(--info)',
  REVIEW_APPROVED:    'var(--success)',
  REVIEW_REJECTED:    'var(--danger)',
  FEATURE_FLAG_TOGGLED: 'var(--accent)',
};

const ActionBadge = ({ action }: { action: string }) => (
  <span className="action-badge" style={{ color: ACTION_COLORS[action] ?? 'var(--text-muted)' }}>
    {action.replace(/_/g, ' ')}
  </span>
);

// ─── Dashboard Page ───────────────────────────────────────────────────────
const DashboardPage = () => {
  const [days, setDays] = useState(7);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => dashboardApi.getStats().then(r => r.data.data),
    refetchInterval: 60_000, // refresh every 1 min
  });

  const { data: regData, isLoading: regLoading } = useQuery({
    queryKey: ['dashboard-registrations', days],
    queryFn:  () => dashboardApi.getRegistrations(days).then(r => r.data.data),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn:  () => dashboardApi.getRecentActivity().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const s = statsData;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Dashboard</h1>
        <span className="dashboard__subtitle">Platform overview — live data</span>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dashboard__kpi-grid">
        <KpiCard icon="◎" label="Total Users"     value={s?.totalUsers  ?? 0} loading={statsLoading} />
        <KpiCard icon="◉" label="Active Today"    value={s?.activeToday ?? 0} loading={statsLoading} />
        <KpiCard icon="◆" label="Premium Users"   value={s?.premiumUsers ?? 0} loading={statsLoading} />
        <KpiCard
          icon="▣"
          label="New Today"
          value={s?.newToday ?? 0}
          delta={s?.userGrowthDelta}
          loading={statsLoading}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="dashboard__charts-row">
        {/* Line Chart */}
        <div className="dashboard__chart-card">
          <div className="dashboard__chart-header">
            <h3>New Registrations</h3>
            <div className="dashboard__day-toggle">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  className={`day-btn ${days === d ? 'day-btn--active' : ''}`}
                  onClick={() => setDays(d)}
                >{d}D</button>
              ))}
            </div>
          </div>
          {regLoading ? (
            <div className="dashboard__chart-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={regData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={v => v.slice(5)}
                />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={30} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard__activity-card">
          <h3 className="dashboard__activity-title">Recent Admin Activity</h3>
          {activityLoading ? (
            <div className="dashboard__activity-skeleton" />
          ) : (
            <ul className="activity-list">
              {(activityData ?? []).map((log) => (
                <li key={log._id} className="activity-item">
                  <ActionBadge action={log.action} />
                  <span className="activity-item__admin">{log.adminName}</span>
                  {log.targetName && (
                    <span className="activity-item__target">→ {log.targetName}</span>
                  )}
                  <span className="activity-item__time">
                    {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
              {(activityData ?? []).length === 0 && (
                <li className="activity-item activity-item--empty">No recent activity</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
