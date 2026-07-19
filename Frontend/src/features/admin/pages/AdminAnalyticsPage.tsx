import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAdminAnalytics } from '../hooks/adminQueries';

const RANGES = [
  { key: '7d',  label: 'Last 7 Days'  },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
] as const;

const CHART_STYLE = {
  tooltip: {
    backgroundColor: '#1e1e2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#e2e8f0',
  },
  axis: { fill: '#94a3b8', fontSize: 11 },
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { data, isLoading } = useAdminAnalytics(range);

  // KPI values from real backend data
  const kpis = [
    {
      label: 'Total Revenue',
      value: data ? `₹${data.kpis.totalRevenue.toLocaleString()}` : '—',
      icon: '💰',
      color: 'text-emerald-400',
    },
    {
      label: 'Avg Rating',
      value: data ? data.kpis.avgRating.toFixed(1) + ' / 10' : '—',
      icon: '⭐',
      color: 'text-amber-400',
    },
    {
      label: 'Total Watchlists',
      value: data ? data.kpis.totalWatchlists.toLocaleString() : '—',
      icon: '📌',
      color: 'text-blue-400',
    },
    {
      label: 'Top Genres',
      value: data ? `${data.genreDistribution[0]?.name ?? '—'}` : '—',
      icon: '🎭',
      color: 'text-violet-400',
    },
  ];

  // User growth chart data
  const userGrowthData = (data?.userGrowth ?? []).map((d) => ({
    label: d.date.slice(5), // MM-DD
    count: d.count,
  }));

  // Top movies as horizontal bar chart
  const topMoviesData = (data?.topMovies ?? []).slice(0, 5).map((m) => ({
    title: m.title.length > 18 ? m.title.slice(0, 16) + '…' : m.title,
    rating: m.averageRating,
    watchlists: m.totalWatchlists ?? 0,
  }));

  // Subscription distribution for revenue bar
  const subscriptionData = (data?.subscriptionDistribution ?? []).map((s) => ({
    plan: s.plan,
    users: s.count,
  }));

  const Skeleton = () => (
    <div className="h-52 bg-white/5 rounded-2xl animate-pulse" />
  );

  return (
    <div className="space-y-8">
      {/* Header + Range Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Platform performance overview</p>
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                range === r.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
            {isLoading ? (
              <div className="h-6 w-24 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* User Growth Line Chart */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">New User Registrations</h2>
        {isLoading ? <Skeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowthData}>
              <XAxis dataKey="label" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_STYLE.tooltip} />
              <Line
                type="monotone" dataKey="count" stroke="#7c3aed"
                strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Movies by Rating */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Rated Movies</h2>
          {isLoading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topMoviesData} layout="vertical">
                <XAxis type="number" domain={[0, 10]} tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="title" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={CHART_STYLE.tooltip} />
                <Bar dataKey="rating" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscription Plan Distribution */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Users by Plan</h2>
          {isLoading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subscriptionData}>
                <XAxis dataKey="plan" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_STYLE.tooltip} />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Genre Distribution */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Genre Distribution (Top 8)</h2>
        {isLoading ? <div className="h-40 bg-white/5 rounded-xl animate-pulse" /> : (
          <div className="flex flex-wrap gap-2">
            {(data?.genreDistribution ?? []).map((g, i) => {
              const colors = ['bg-violet-500/20 text-violet-300', 'bg-blue-500/20 text-blue-300',
                'bg-emerald-500/20 text-emerald-300', 'bg-amber-500/20 text-amber-300',
                'bg-rose-500/20 text-rose-300', 'bg-indigo-500/20 text-indigo-300',
                'bg-cyan-500/20 text-cyan-300', 'bg-pink-500/20 text-pink-300'];
              return (
                <span key={g.name} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${colors[i % colors.length]}`}>
                  {g.name} <span className="opacity-60">({g.count})</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
