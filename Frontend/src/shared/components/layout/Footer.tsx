import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-[#09090b] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🎬</span>
            <span className="text-white font-bold text-xl group-hover:text-amber-300 transition-colors">
              Cine<span className="text-amber-400">Track</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { to: '/movies',       label: 'Browse Movies' },
              { to: '/watchlist',    label: 'My Watchlist' },
              { to: '/profile',      label: 'Profile' },
              { to: '/subscription', label: 'Subscription' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © {year} CineTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <span>Built with</span>
            <span className="text-amber-400 mx-0.5">♥</span>
            <span>using React + Node.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
