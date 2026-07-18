import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import { useLogoutMutation } from '../../auth/hooks/authQueries';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/movies', label: 'Movies', icon: '🎬', end: false },
  { to: '/admin/users', label: 'Users', icon: '👥', end: false },
  { to: '/admin/reviews', label: 'Reviews', icon: '⭐', end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈', end: false },
];

export default function AdminLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const { mutate: logout } = useLogoutMutation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#07070f] text-slate-100">

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          bg-[#0e0e1a] border-r border-white/6
          transition-all duration-300
          ${sidebarOpen ? 'w-[240px]' : 'w-[68px]'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/6">
          <span className="text-xl shrink-0">🎬</span>
          {sidebarOpen && (
            <span className="font-bold text-white text-sm">
              Cine<span className="text-violet-400">Track</span>
              <span className="ml-2 text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                Admin
              </span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="mx-2 mb-3 flex items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors text-xs"
        >
          {sidebarOpen ? '◀ Collapse' : '▶'}
        </button>
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-[240px]' : 'ml-[68px]'}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-[#07070f]/90 backdrop-blur-xl border-b border-white/6 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300 hidden sm:block">{user?.name}</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => logout()}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
