import { Movie } from '../../../types';
import { useIsInWatchlist } from '../../watchlist/hooks/watchlistQueries';
import { useToggleWatchlist } from '../hooks/moviesMutations';
import { useAppSelector } from '../../../store';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  showQuality?: boolean;
  dateOverride?: string;
}

function getQualityBadges(movie: Movie): string[] {
  if (movie.videoUrls && Object.keys(movie.videoUrls).length > 0) {
    const keys = Object.keys(movie.videoUrls).filter(k => k !== 'default');
    if (keys.length) return keys.sort((a, b) => {
      const order = ['480p', '720p', '1080p', '4k'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }
  // Fallback quality display based on processingStatus
  if (movie.processingStatus === 'ready') return ['720p', '1080p'];
  return ['480p', '720p'];
}

export default function MovieCard({ movie, onClick, showQuality = true, dateOverride }: MovieCardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const inWatchlist = useIsInWatchlist(movie._id);
  const { mutate: toggleWatchlist, isPending } = useToggleWatchlist();

  const posterUrl = movie.posterPath
    ? (movie.posterPath.startsWith('http')
        ? movie.posterPath
        : `https://image.tmdb.org/t/p/w342${movie.posterPath}`)
    : null;

  const qualities = getQualityBadges(movie);

  const displayDate = dateOverride || movie.createdAt;
  const calDate = displayDate ? new Date(displayDate) : null;
  const monthName = calDate ? calDate.toLocaleString('default', { month: 'short' }).toUpperCase() : '';
  const day = calDate ? calDate.getDate() : '';

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleWatchlist({ movieId: movie._id, inWatchlist });
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#1a1a1a',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        aspectRatio: '2 / 3',
      }}
      className="ct-movie-card"
    >
      {/* Poster */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={movie.title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
          }}
          className="ct-card-img"
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#222', color: '#555', fontSize: 40,
        }}>
          🎬
        </div>
      )}

      {/* Date badge — top right */}
      {calDate && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 10,
        }}>
          <div style={{ background: '#f59e0b', color: '#09090b', fontSize: 9, fontWeight: 800, width: '100%', textAlign: 'center', padding: '2px 4px', textTransform: 'uppercase' }}>
            {monthName}
          </div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, padding: '2px 6px 3px' }}>
            {day}
          </div>
        </div>
      )}

      {/* Watchlist button — top left (authenticated only) */}
      {isAuthenticated && (
        <button
          onClick={handleWatchlist}
          disabled={isPending}
          title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          style={{
            position: 'absolute', top: 6, left: 6,
            width: 28, height: 28, borderRadius: '50%',
            border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
            background: inWatchlist ? 'rgba(251,191,36,0.9)' : 'rgba(0,0,0,0.6)',
            color: '#fff', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            backdropFilter: 'blur(4px)',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {inWatchlist ? '❤' : '♡'}
        </button>
      )}

      {/* Bottom overlay: gradient + title + quality */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
        padding: '28px 8px 8px',
      }}>
        <p style={{
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.3,
          margin: '0 0 5px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {movie.title}
        </p>

        {showQuality && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {qualities.map((q) => (
              <span
                key={q}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#e2e8f0',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 3,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {q}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}