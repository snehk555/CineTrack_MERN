import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAdminAnalytics } from '../hooks/adminQueries';

const RANGES = [
  { key: '7d', label: 'Last 7 Days' },
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

// Placeholder data — Phase 16 live data from backend
const PLACEHOLDER = {
  dau: [
    { label: 'Day 1', value: 120 }, { label: 'Day 2', value: 145 },
    { label: 'Day 3', value: 132 }, { label: 'Day 4', value: 189 },
    { label: 'Day 5', value: 210 }, { label: 'Day 6', value: 178 },
    { label: 'Day 7', value: 235 },
  ],
  topMovies: [
    { title: 'Inception', views: 4200 }, { title: 'Interstellar', views: 3800 },
    { title: 'The Dark Knight', views: 3500 }, { title: 'Avengers', views: 3100 },
    { title: 'Parasite', views: 2900 },
  ],
  revenue: [
    { label: 'Week 1', mrr: 42000 }, { label: 'Week 2', mrr: 48000 },
    { label: 'Week 3', mrr: 45000 }, { label: 'Week 4', mrr: 52000 },
  ],
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const { isLoading } = useAdminAnalytics(range);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Platform performance overview</p>
        </div>

        {/* Range Picker */}
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

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Revenue', value: '₹52,000', icon: '💰', trend: '+12%', color: 'text-emerald-400' },
          { label: 'Active Subscribers', value: '1,248', icon: '👑', trend: '+8%', color: 'text-emerald-400' },
          { label: 'Churned', value: '34', icon: '📉', trend: '-2%', color: 'text-red-400' },
          { label: 'Avg Session', value: '18 min', icon: '⏱️', trend: '+5%', color: 'text-emerald-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
            {isLoading ? (
              <div className="h-6 w-20 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            )}
            <p className={`text-xs mt-1 font-medium ${kpi.color}`}>{kpi.trend} this period</p>
          </div>
        ))}
      </div>

      {/* DAU Chart */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Daily Active Users</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={PLACEHOLDER.dau}>
            <XAxis dataKey="label" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_STYLE.tooltip} />
            <Line
              type="monotone" dataKey="value" stroke="#7c3aed"
              strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Most Viewed Movies */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">🔥 Most Viewed Movies</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PLACEHOLDER.topMovies} layout="vertical">
              <XAxis type="number" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={CHART_STYLE.tooltip} />
              <Bar dataKey="views" fill="#7c3aed" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MRR Chart */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">💳 Monthly Recurring Revenue (₹)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PLACEHOLDER.revenue}>
              <XAxis dataKey="label" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={CHART_STYLE.tooltip}
                formatter={(v: unknown) => [`₹${Number(v ?? 0).toLocaleString()}`, 'MRR']}
              />
              <Bar dataKey="mrr" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
