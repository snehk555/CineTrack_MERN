import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch, setSearch } from '../../../store';
import { useLogoutMutation } from '../../../features/auth/hooks/authQueries';
import NotificationDropdown from '../ui/NotificationDropdown';

export default function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logout } = useLogoutMutation();

  const [searchInput, setSearchInput] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { dispatch(setSearch(searchInput)); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  return (
    <nav className="sticky top-0 z-50 bg-[#09090f]/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🎬</span>
          <span className="text-white font-bold text-lg">
            Cine<span className="text-violet-400">Track</span>
          </span>
        </Link>

        {/* Search */}
        {isAuthenticated && (
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        )}

        {/* Nav Links */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/movies" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                Browse
              </Link>
              <Link to="/watchlist" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                Watchlist
              </Link>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center border-2 border-violet-500/50 hover:scale-110 transition-transform"
                >
                  {user?.name.charAt(0).toUpperCase()}
                </button>

                {profileOpen && (
                  <div
                    className="absolute top-12 right-0 w-52 bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    style={{ animation: 'fadeInDown 0.15s ease-out' }}
                  >
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-white text-sm font-medium">{user?.name}</p>
                      <p className="text-slate-400 text-xs">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                        👤 Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-violet-300 hover:bg-white/5 transition-colors">
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
