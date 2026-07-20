import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../features/watchlist/hooks/watchlistQueries';
import MovieCard from '../features/movies/components/MovieCard';
import SkeletonCard from '../features/movies/components/SkeletonCard';
import type { WatchlistEntry, Movie } from '../types';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { data: watchlist, isLoading } = useWatchlist();

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">My Watchlist</h1>
          <p className="text-slate-400 text-sm">
            {watchlist?.length ?? 0} movies saved
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: watchlist?.length ?? 0, icon: '🎬' },
            { label: 'This Month', value: watchlist?.filter((e) => {
              const added = new Date(e.createdAt);
              const now = new Date();
              return added.getMonth() === now.getMonth();
            }).length ?? 0, icon: '📅' },
            { label: 'Genres', value: '—', icon: '🎭' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/8 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : watchlist?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-white text-lg font-medium">Your watchlist is empty</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">Start adding movies you want to watch</p>
            <button
              onClick={() => navigate('/movies')}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist?.map((entry: WatchlistEntry) => {
              const movie = entry.movieId as Movie;
              return typeof movie === 'object' ? (
                <MovieCard
                  key={entry._id}
                  movie={movie}
                  onClick={() => navigate(`/movies/${movie._id}`)}
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
