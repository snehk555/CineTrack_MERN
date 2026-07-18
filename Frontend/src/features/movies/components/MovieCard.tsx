import { Movie } from '../../../types';
import { useIsInWatchlist } from '../../watchlist/hooks/watchlistQueries';
import { useToggleWatchlist } from '../hooks/moviesMutations';
import { useAppSelector } from '../../../store';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const inWatchlist = useIsInWatchlist(movie._id);
  const { mutate: toggleWatchlist, isPending } = useToggleWatchlist();

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
    : null;

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleWatchlist({ movieId: movie._id, inWatchlist });
  };

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white/5 border border-white/8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/50 hover:border-violet-500/30"
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-white/5 relative overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-4xl">
            🎬
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              ⭐ {movie.averageRating.toFixed(1)}
            </div>
            {isAuthenticated && (
              <button
                onClick={handleWatchlist}
                disabled={isPending}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm
                  transition-all duration-200 active:scale-90
                  ${inWatchlist
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/20 text-white hover:bg-violet-500/80'}
                `}
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {inWatchlist ? '❤️' : '🤍'}
              </button>
            )}
          </div>
        </div>

        {/* Premium Badge */}
        {movie.processingStatus === 'processing' && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Processing
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1">{movie.title}</h3>
        <p className="text-slate-500 text-xs mt-0.5">{movie.releaseYear ?? '—'}</p>
      </div>
    </div>
  );
}