import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, setSearch } from '../../../store';
import { useLogoutMutation } from '../../../features/auth/hooks/authQueries';
import NotificationDropdown from '../ui/NotificationDropdown';

const YEARS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i);

export default function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mutate: logout } = useLogoutMutation();

  const [searchInput, setSearchInput] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mobileSearchOpen] = useState(false);

  const yearRef = useRef<HTMLDivElement>(null);

  // Debounced search dispatch
  useEffect(() => {
    const timer = setTimeout(() => { dispatch(setSearch(searchInput)); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const location = useLocation();
  const isDetailPage = /^\/(movies|series)\/[^/]+$/.test(location.pathname);

  const navLinkStyle = (active = false): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: 600,
    color: active ? '#fbbf24' : '#94a3b8',
    textDecoration: 'none',
    padding: '6px 4px',
    borderBottom: active ? '2px solid #fbbf24' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  });

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(9,9,11,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '0 20px',
        height: 56,
        display: 'flex', alignItems: 'center',
        gap: 20,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🎬</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>
            Cine<span style={{ color: '#fbbf24' }}>Track</span>
          </span>
        </Link>

        {/* Nav links — center */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flex: 1 }}>
          <Link to="/" style={navLinkStyle(location.pathname === '/')}>Home</Link>
          <Link to="/movies" style={navLinkStyle(isActive('/movies'))}>Movies</Link>
          <Link to="/series" style={navLinkStyle(isActive('/series'))}>Web Series</Link>
          {isAuthenticated && (
            <Link to="/watchlist" style={navLinkStyle(isActive('/watchlist'))}>Watchlist</Link>
          )}

          {/* By Year dropdown */}
          <div ref={yearRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setYearOpen(p => !p); }}
              style={{
                ...navLinkStyle(yearOpen),
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              By Year <span style={{ fontSize: 10, opacity: 0.7 }}>{yearOpen ? '▲' : '▼'}</span>
            </button>
            {yearOpen && (
              <div className="ct-nav-dropdown" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setYearOpen(false);
                      navigate(`/movies?year=${year}`);
                    }}
                    style={{ display: 'block', width: '100%', padding: '7px 16px', textAlign: 'left', fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#fbbf24')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Search + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Search box — hidden on detail pages */}
          {!isDetailPage && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: mobileSearchOpen ? 180 : 150,
                  padding: '6px 12px 6px 32px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  fontSize: 12,
                  outline: 'none',
                  transition: 'width 0.2s, border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#fbbf24')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: '#52525b', fontSize: 13, pointerEvents: 'none',
              }}>
                🔍
              </span>
            </div>
          )}

          {isAuthenticated ? (
            <>
              <NotificationDropdown />

              {/* User avatar + dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #78350f)',
                    border: '2px solid rgba(245,158,11,0.4)',
                    color: '#fff', fontWeight: 800, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.1)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                >
                  {user?.name.charAt(0).toUpperCase()}
                </button>

                {profileOpen && (
                  <div
                    style={{
                      position: 'absolute', top: 42, right: 0,
                      width: 200,
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                      animation: 'fadeInDown 0.15s ease-out',
                      zIndex: 100,
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>{user?.name}</p>
                      <p style={{ color: '#52525b', fontSize: 11, margin: '2px 0 0' }}>{user?.email}</p>
                    </div>
                    <div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
                        👤 Profile
                      </Link>
                      <Link to="/watchlist" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
                        🔖 Watchlist
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: '#fbbf24', textDecoration: 'none' }}>
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { setProfileOpen(false); logout(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
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
              <Link to="/login" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
                Sign In
              </Link>
              <Link to="/register" style={{
                fontSize: 12, fontWeight: 700,
                background: '#f59e0b', color: '#09090b',
                padding: '6px 14px', borderRadius: 6, textDecoration: 'none',
                transition: 'background 0.2s',
              }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
