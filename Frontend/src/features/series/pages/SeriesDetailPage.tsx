import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSeriesDetail, useSeasons, useEpisodes } from '../hooks/seriesQueries';

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: series, isLoading: seriesLoading } = useSeriesDetail(id!);
  const { data: seasons, isLoading: seasonsLoading } = useSeasons(id!);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const { data: episodes } = useEpisodes(id!, selectedSeasonId);

  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0]._id);
    }
  }, [seasons, selectedSeasonId]);

  if (seriesLoading || seasonsLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
        <div style={{ height: '70vh', background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!series) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: 20 }}>Series not found.</p>
      </div>
    );
  }

  const posterUrl = series.posterPath
    ? (series.posterPath.startsWith('http') ? series.posterPath : `https://image.tmdb.org/t/p/w500${series.posterPath}`)
    : '';

  const selectedSeason = seasons?.find((s: any) => s._id === selectedSeasonId);

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e', paddingBottom: 60 }}>
      {/* Breadcrumb */}
      <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', fontSize: 12, color: '#94a3b8' }}>
          <Link to="/" style={{ color: '#fbbf24', textDecoration: 'none' }}>Home</Link> »{' '}
          <Link to="/series" style={{ color: '#fbbf24', textDecoration: 'none' }}>Web Series</Link> »{' '}
          <span style={{ color: '#e2e8f0' }}>{series.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '40px auto 0', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 40, flexWrap: 'wrap' }}>
          {posterUrl && (
            <div style={{ width: 220, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={posterUrl} alt={series.title} style={{ width: '100%', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, marginBottom: 12 }}>{series.title}</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, border: '1px solid rgba(251,191,36,0.3)' }}>
                ⭐ {series.averageRating?.toFixed(1) ?? '0.0'} / 10
              </span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{series.releaseYear}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{series.totalSeasons} Seasons</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{series.totalEpisodes} Episodes</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, marginBottom: 20, maxWidth: 800 }}>{series.overview}</p>
            {series.genreIds?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {series.genreIds.map((g: any) => (
                  <span key={g._id || g} style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                    {g.name || g}
                  </span>
                ))}
              </div>
            )}
            
            <button
              onClick={() => navigate(`/series/${id}/watch?seasonId=${selectedSeasonId || ''}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #71bb5d 0%, #4a8e38 100%)',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(113, 187, 93, 0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: 18 }}>▶</span> Watch Now
            </button>
          </div>
        </div>

        {/* Episode List for selected season */}
        {episodes && episodes.length > 0 && (
          <div style={{ background: '#111', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                {selectedSeason ? `Season ${selectedSeason.seasonNumber}: ${selectedSeason.title}` : 'Episodes'}
              </h2>
              <select
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                style={{
                  background: '#222', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '6px 12px', borderRadius: 6, fontSize: 14, outline: 'none'
                }}
              >
                {seasons?.map((s: any) => (
                  <option key={s._id} value={s._id}>Season {s.seasonNumber}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {episodes.map((ep: any) => {
                const thumbUrl = ep.thumbnailUrl || '';
                return (
                  <div
                    key={ep._id}
                    onClick={() => navigate(`/series/${id}/watch?seasonId=${selectedSeasonId || ''}&episodeId=${ep._id}`)}
                    style={{
                      display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px',
                      borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid transparent',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 100, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1e293b' }}>
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 20 }}>📺</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                        Ep {ep.episodeNumber}: {ep.title}
                      </p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {ep.runtime && <span style={{ color: '#52525b', fontSize: 12 }}>{ep.runtime} min</span>}
                        {ep.airDate && <span style={{ color: '#52525b', fontSize: 12 }}>{formatDate(ep.airDate)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
