import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '../hooks/moviesQueries';
import { useAppSelector } from '../../../store';
import Badge from '../../../shared/components/ui/Badge';
import ReviewsList from '../../reviews/components/ReviewsList';
import type { Genre } from '../../../types';
import { useToggleWatchlist } from '../hooks/moviesMutations';

// ─── Constants ────────────────────────────────────────────────────────────────
const IMG_BASE = 'https://image.tmdb.org/t/p/';

function formatRuntime(mins?: number) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Watchlist Button ─────────────────────────────────────────────────────────
function WatchlistButton({ movieId }: { movieId: string }) {
  const movieIds = useAppSelector((s) => s.watchlist.movieIds);
  const isIn = movieIds.includes(movieId);
  const { mutate: toggle, isPending } = useToggleWatchlist();

  return (
    <button
      onClick={() => toggle({ movieId, inWatchlist: isIn })}
      disabled={isPending}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isIn ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${isIn ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.2)'}`,
        color: isIn ? '#facc15' : '#fff',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        fontSize: 18, transition: 'all 0.2s',
        backdropFilter: 'blur(8px)',
      }}
      title={isIn ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      {isPending ? '…' : isIn ? '✓' : '+'}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      <div style={{ height: '100vh', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

// ─── Trailer Modal ────────────────────────────────────────────────────────────
function TrailerModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embedUrl = url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -44, right: 0,
            background: 'none', border: 'none', color: '#fff',
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            opacity: 0.7,
          }}
        >
          ✕ Close Trailer
        </button>
        <div style={{ aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title="Trailer"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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
  const [showTrailer, setShowTrailer] = useState(false);

  if (isLoading) return <Skeleton />;

  if (isError || !movie) {
    return (
      <div style={{
        minHeight: '100vh', background: '#09090b',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 56 }}>🎬</span>
        <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: 0 }}>Movie not found</h1>
        <button
          onClick={() => navigate('/movies')}
          style={{ padding: '10px 24px', borderRadius: 12, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Browse Movies
        </button>
      </div>
    );
  }

  const backdrop = movie.backdropPath
    ? (movie.backdropPath.startsWith('http') ? movie.backdropPath : `${IMG_BASE}w1280${movie.backdropPath}`)
    : null;
  const poster = movie.posterPath
    ? (movie.posterPath.startsWith('http') ? movie.posterPath : `${IMG_BASE}w500${movie.posterPath}`)
    : null;
  const genres = (movie.genreIds as Genre[]) ?? [];
  const isReady = movie.processingStatus === 'ready' && !!Object.keys(movie.videoUrls || {}).length;

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f8fafc' }}>

      {/* Trailer Modal */}
      {showTrailer && movie.trailerUrl && (
        <TrailerModal url={movie.trailerUrl} onClose={() => setShowTrailer(false)} />
      )}

      {/* ═══ HERO — Full bleed backdrop, Hotstar style ═════════════════════ */}
      <div style={{ position: 'relative', height: 'calc(100vh - 64px)', minHeight: 520, overflow: 'hidden' }}>

        {/* Backdrop */}
        {backdrop ? (
          <img
            src={backdrop}
            alt={movie.title}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #09090b 100%)',
          }} />
        )}

        {/* Poster as background layer behind text (right side) */}
        {poster && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%',
            background: `url(${poster}) center top / cover no-repeat`,
            opacity: 1, 
            filter: 'blur(0px)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
            zIndex: 3, // Above the heavy black gradient, but below text
          }} />
        )}

        {/* Gradient overlays — strong left + bottom fade so text is always readable */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to right, rgba(9,9,11,0.96) 0%, rgba(9,9,11,0.75) 40%, rgba(9,9,11,0.2) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to bottom, rgba(9,9,11,0.2) 0%, transparent 30%, rgba(9,9,11,0.5) 70%, #09090b 100%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 24, left: 24,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 10,
          }}
        >
          ← Back
        </button>

        {/* ── Movie Info — anchored bottom-left, full width ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 48px 56px',
          maxWidth: 720,
          zIndex: 10, // Ensure text is above any background layers
        }}>


          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 900, color: '#fff',
            margin: '0 0 12px', lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {movie.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {movie.releaseYear && (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{movie.releaseYear}</span>
            )}
            {movie.runtime && (
              <>
                <span style={{ color: '#475569', fontSize: 11 }}>•</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatRuntime(movie.runtime)}</span>
              </>
            )}
            {movie.spokenLanguage && (
              <>
                <span style={{ color: '#475569', fontSize: 11 }}>•</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{movie.spokenLanguage.toUpperCase()}</span>
              </>
            )}
            {(movie.averageRating ?? 0) > 0 && (
              <>
                <span style={{ color: '#475569', fontSize: 11 }}>•</span>
                <span style={{ color: '#facc15', fontSize: 13, fontWeight: 600 }}>★ {(movie.averageRating!).toFixed(1)}</span>
              </>
            )}
            {movie.isFeatured && <Badge variant="violet" size="sm">🔥 Trending</Badge>}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {genres.map((g) => {
                const genre = typeof g === 'string' ? { _id: g, name: g } : g;
                return (
                  <span key={genre._id} style={{
                    padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
                    color: '#c4b5fd',
                  }}>
                    {genre.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <p style={{
              color: '#cbd5e1', fontSize: 14, lineHeight: 1.7,
              margin: '0 0 28px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {movie.overview}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

            {/* Watch Now / Coming Soon */}
            {isReady ? (
              <button
                onClick={() => navigate(`/movies/${id}/watch`)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: 18 }}>▶</span> Watch Now
              </button>
            ) : (
              <button disabled style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748b', cursor: 'not-allowed',
              }}>
                ⏳ Coming Soon
              </button>
            )}

            {/* Watchlist circle button */}
            <WatchlistButton movieId={movie._id} />

            {/* Trailer button */}
            {movie.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
              >
                🎬 Trailer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BELOW HERO — Details, Cast, Reviews ════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Watchlists', val: (movie.totalWatchlists || 0).toLocaleString() },
            { label: 'Comments', val: (movie.totalReviews || 0).toLocaleString() },
            { label: 'TMDB Rating', val: `${(movie.averageRating || 0).toFixed(1)} / 10` },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: 22, margin: '0 0 2px' }}>{val}</p>
              <p style={{ color: '#475569', fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Top Cast</h2>
            <div 
              className="cast-carousel"
              style={{ 
                display: 'flex', 
                gap: 24, 
                overflowX: 'auto', 
                paddingBottom: 16,
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none',  // IE/Edge
                WebkitOverflowScrolling: 'touch', // iOS
              }}>
              <style>
                {`.cast-carousel::-webkit-scrollbar { display: none; }`}
              </style>
              {movie.cast.map((actor, idx) => {
                const imgUrl = actor.profilePath ? (actor.profilePath.startsWith('http') ? actor.profilePath : `${IMG_BASE}w185${actor.profilePath}`) : null;
                return (
                  <div key={idx} style={{ flexShrink: 0, width: 120, textAlign: 'center' }}>
                    <div style={{
                      width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
                      background: 'rgba(124,58,237,0.1)', 
                      border: '2px solid rgba(124,58,237,0.2)',
                      margin: '0 auto 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#c4b5fd', fontSize: 28, fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {imgUrl
                        ? <img src={imgUrl} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{actor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <p style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>{actor.name}</p>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.3 }}>{actor.character}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Screenshots */}
        {movie.screenshots && movie.screenshots.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Gallery</h2>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
              {movie.screenshots.map((shot, idx) => (
                <img
                  key={idx}
                  src={shot.startsWith('http') ? shot : `${IMG_BASE}w780${shot}`}
                  alt={`Screenshot ${idx + 1}`}
                  style={{ flexShrink: 0, height: 160, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <ReviewsList movieId={movie._id} movieTitle={movie.title} />
      </div>
    </div>
  );
}