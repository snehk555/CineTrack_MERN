import { useNavigate } from 'react-router-dom';
import { useTrendingMovies, useMovies } from '../features/movies/hooks/moviesQueries';
import MovieCard from '../features/movies/components/MovieCard';
import SkeletonCard from '../features/movies/components/SkeletonCard';
import { useAppSelector } from '../store';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: trending, isLoading: trendingLoading } = useTrendingMovies();
  const { data: newReleases, isLoading: releasesLoading } = useMovies();

  const featuredMovie = trending?.[0];

  return (
    <div className="min-h-screen bg-[#09090f]">

      {/* Hero Section */}
      {featuredMovie && (
        <div className="relative h-[70vh] overflow-hidden">
          {featuredMovie.backdropPath && (
            <img
              src={`https://image.tmdb.org/t/p/original${featuredMovie.backdropPath}`}
              alt={featuredMovie.title}
              className="w-full h-full object-cover scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090f] via-[#09090f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-transparent to-transparent" />

          <div className="absolute bottom-12 left-12 max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-violet-500/30 border border-violet-500/50 text-violet-300 text-xs px-3 py-1 rounded-full font-medium">
                🔥 Trending
              </span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-3">
              {featuredMovie.title}
            </h1>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              {featuredMovie.overview}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/movies/${featuredMovie._id}`)}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                ▶ Watch Now
              </button>
              <button
                onClick={() => navigate(`/movies/${featuredMovie._id}`)}
                className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              >
                ℹ More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">

        {/* Trending This Week */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">🔥 Trending This Week</h2>
          {trendingLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trending?.map((movie) => (
                <div key={movie._id} className="shrink-0 w-44">
                  <MovieCard movie={movie} onClick={() => navigate(`/movies/${movie._id}`)} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-white">✨ New Releases</h2>
            <button onClick={() => navigate('/movies')} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </button>
          </div>
          {releasesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {newReleases?.data?.slice(0, 10).map((movie) => (
                <MovieCard key={movie._id} movie={movie} onClick={() => navigate(`/movies/${movie._id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Welcome Banner for Guest */}
        {!user && (
          <section className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Join CineTrack</h2>
            <p className="text-slate-400 mb-6">Track, discover, and organize your movie universe.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/register')} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors">
                Get Started Free
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl border border-white/10 transition-colors">
                Sign In
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}