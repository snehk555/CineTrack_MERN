import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { useAdminDashboard } from '../hooks/adminQueries';

// Placeholder chart data (Phase 16 — live from analytics API)
const userGrowthData = [
  { day: 'Mon', users: 12 }, { day: 'Tue', users: 18 }, { day: 'Wed', users: 15 },
  { day: 'Thu', users: 25 }, { day: 'Fri', users: 30 }, { day: 'Sat', users: 22 },
  { day: 'Sun', users: 28 },
];

const genreData = [
  { name: 'Action', value: 35 }, { name: 'Drama', value: 25 },
  { name: 'Comedy', value: 20 }, { name: 'Horror', value: 10 }, { name: 'Other', value: 10 },
];

const revenueData = [
  { month: 'Feb', revenue: 12000 }, { month: 'Mar', revenue: 15000 },
  { month: 'Apr', revenue: 18000 }, { month: 'May', revenue: 22000 },
  { month: 'Jun', revenue: 19000 }, { month: 'Jul', revenue: 28000 },
];

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#6b7280'];

const CHART_STYLE = {
  tooltip: { backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' },
  axis: { fill: '#94a3b8', fontSize: 11 },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <button
          onClick={() => navigate('/admin/movies')}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors active:scale-95 flex items-center gap-2"
        >
          + Add Movie
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👥" label="Total Users" value={stats?.totalUsers ?? 0} trend={8} loading={isLoading} />
        <StatsCard icon="🆕" label="New Today" value={stats?.newUsersToday ?? 0} trend={12} loading={isLoading} />
        <StatsCard icon="🎬" label="Total Movies" value={stats?.totalMovies ?? 0} loading={isLoading} />
        <StatsCard icon="💳" label="Subscriptions" value={stats?.activeSubscriptions ?? 0} trend={3} loading={isLoading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* User Growth Line Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">User Growth — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowthData}>
              <XAxis dataKey="day" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_STYLE.tooltip} />
              <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Pie Chart */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Movies by Genre</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={genreData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {genreData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={CHART_STYLE.tooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Revenue — Last 6 Months (₹)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData}>
            <XAxis dataKey="month" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_STYLE.tooltip} formatter={(v: unknown) => [`₹${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Registrations</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : stats?.recentUsers?.length ? (
            <div className="space-y-2">
              {stats.recentUsers.slice(0, 6).map((u) => (
                <div key={u._id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{u.name}</p>
                    <p className="text-slate-500 text-xs truncate">{u.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent users</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recently Added Movies</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : stats?.recentMovies?.length ? (
            <div className="space-y-2">
              {stats.recentMovies.slice(0, 6).map((m) => (
                <div key={m._id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xl">🎬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{m.title}</p>
                    <p className="text-slate-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent movies</p>
          )}
        </div>
      </div>
    </div>
  );
}
