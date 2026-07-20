import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '../hooks/moviesQueries';
import { useAppSelector } from '../../../store';
import Badge from '../../../shared/components/ui/Badge';
import ReviewsList from '../../reviews/components/ReviewsList';
import type { Genre } from '../../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_BASE = 'https://image.tmdb.org/t/p/';

function formatRuntime(mins?: number) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function statusVariant(status: string) {
  if (status === 'published') return 'green' as const;
  if (status === 'draft') return 'amber' as const;
  return 'slate' as const;
}

// ─── Watchlist Button ─────────────────────────────────────────────────────────
function WatchlistButton({ movieId }: { movieId: string }) {
  const movieIds = useAppSelector((s) => s.watchlist.movieIds);
  const isInWatchlist = movieIds.includes(movieId);

  return (
    <button
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        isInWatchlist
          ? 'bg-amber-600 text-white hover:bg-amber-700'
          : 'bg-white/8 border border-white/15 text-slate-300 hover:bg-white/12 hover:text-white'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d={isInWatchlist
          ? 'M2 2a1 1 0 011-1h10a1 1 0 011 1v13l-6-3-6 3V2z'
          : 'M2 2a1 1 0 011-1h10a1 1 0 011 1v13l-6-3-6 3V2zm1 1v10.72l5-2.5 5 2.5V3H3z'}
        />
      </svg>
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  );
}

// ─── Star Rating Display ──────────────────────────────────────────────────────
function RatingDisplay({ rating, total }: { rating: number; total: number }) {
  const pct = (rating / 10) * 100;
  return (
    <div className="flex items-center gap-3">
      {/* Ring */}
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {rating.toFixed(1)}
        </span>
      </div>
      <div>
        <p className="text-white font-semibold">{rating.toFixed(1)} / 10</p>
        <p className="text-slate-500 text-xs">{total.toLocaleString()} ratings</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] animate-pulse">
      <div className="h-72 bg-white/5" />
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        <div className="w-48 h-72 rounded-2xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-8 bg-white/5 rounded-xl w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError } = useMovieDetail(id ?? '');
  const [isPlaying, setIsPlaying] = useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-center px-6">
        <span className="text-5xl">🎬</span>
        <h1 className="text-white text-xl font-semibold">Movie not found</h1>
        <p className="text-slate-400 text-sm">This movie may have been removed or doesn't exist.</p>
        <button
          onClick={() => navigate('/movies')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
        >
          Browse Movies
        </button>
      </div>
    );
  }

  const backdrop = movie.backdropPath ? `${IMG_BASE}w1280${movie.backdropPath}` : null;
  const poster   = movie.posterPath   ? `${IMG_BASE}w500${movie.posterPath}`    : null;
  const genres   = movie.genreIds as Genre[];

  return (
    <div className="min-h-screen bg-[#09090b]">

      {/* ── Backdrop Hero ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {backdrop ? (
          <img
            src={backdrop}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-amber-900/20 to-[#09090b]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white text-sm backdrop-blur-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-24 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

          {/* ── Poster ── */}
          <div className="shrink-0 md:w-44">
            {poster ? (
              <img
                src={poster}
                alt={movie.title}
                className="w-32 md:w-44 h-auto rounded-2xl shadow-2xl border border-white/10 mx-auto md:mx-0"
              />
            ) : (
              <div className="w-32 md:w-44 aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto md:mx-0">
                🎬
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex-1 pt-2">
            {/* Title row */}
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{movie.title}</h1>
              {movie.isFeatured && <Badge variant="violet" size="sm">⭐ Featured</Badge>}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-sm mb-4">
              {movie.releaseYear && <span>{movie.releaseYear}</span>}
              {movie.releaseYear && movie.runtime && <span>·</span>}
              {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
              {movie.language && <span>· {movie.language.toUpperCase()}</span>}
              {(movie.totalReviews || 0) > 0 && <span>· {movie.totalReviews} reviews</span>}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {genres.map((g) => {
                  const genre = typeof g === 'string' ? { _id: g, name: g } : g;
                  return (
                    <Badge key={genre._id} variant="violet" size="sm">{genre.name}</Badge>
                  );
                })}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-2xl">
                {movie.overview}
              </p>
            )}

            {/* Rating + Watchlist + Play */}
            <div className="flex flex-wrap items-center gap-6">
              <RatingDisplay rating={movie.averageRating || 0} total={movie.totalRatings || 0} />
              <div className="flex gap-3">
                <WatchlistButton movieId={movie._id} />
                {movie.processingStatus === 'ready' && movie.videoUrls && (
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                  >
                    ▶ Play Movie
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-6 pt-5 border-t border-white/8">
              <div className="text-center">
                <p className="text-white font-bold text-lg">{(movie.totalWatchlists || 0).toLocaleString()}</p>
                <p className="text-slate-500 text-xs">Watchlists</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{(movie.totalReviews || 0).toLocaleString()}</p>
                <p className="text-slate-500 text-xs">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{(movie.averageRating || 0).toFixed(1)}</p>
                <p className="text-slate-500 text-xs">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Video Player Overlay ── */}
        {isPlaying && movie.videoUrls && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300"
            onClick={() => setIsPlaying(false)}
          >
            <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 pointer-events-none">
              <h2 className="text-white font-bold text-xl drop-shadow-md">{movie.title}</h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
                className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md pointer-events-auto transition-colors"
              >
                Close Player (✕)
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 md:p-12 mt-12">
              <div 
                className="w-full max-w-6xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <video 
                  src={Object.values(movie.videoUrls)[0] || ''} 
                  controls 
                  controlsList="nodownload"
                  autoPlay 
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}

        {/* ── Screenshots Gallery ── */}
        {movie.screenshots && movie.screenshots.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6">Gallery</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
              {movie.screenshots.map((shot, idx) => (
                <div key={idx} className="shrink-0 snap-start">
                  <img 
                    src={shot.startsWith('http') ? shot : `${IMG_BASE}w780${shot}`} 
                    alt={`${movie.title} screenshot ${idx + 1}`} 
                    className="h-40 md:h-48 rounded-xl object-cover shadow-lg border border-white/5"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cast & Crew ── */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6">Top Cast</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
              {movie.cast.map((actor, idx) => (
                <div key={idx} className="shrink-0 snap-start flex flex-col items-center w-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 mb-3 overflow-hidden border border-white/10">
                    {actor.profilePath ? (
                      <img src={`${IMG_BASE}w185${actor.profilePath}`} alt={actor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium leading-tight">{actor.name}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-tight">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Trailer ── */}
        {movie.trailerUrl && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white mb-4">Trailer</h2>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 max-w-3xl">
              <iframe
                src={movie.trailerUrl.replace('watch?v=', 'embed/')}
                title={`${movie.title} trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <ReviewsList movieId={movie._id} movieTitle={movie.title} />
      </div>
    </div>
  );
}