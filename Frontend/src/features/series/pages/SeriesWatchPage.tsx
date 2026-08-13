import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSeriesDetail, useSeasons, useEpisodes } from '../hooks/seriesQueries';
import type { Episode } from '../../../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKEND = (import.meta.env.VITE_API_URL as string | undefined)
  ?.replace(/\/api\/?$/, '') ?? 'http://localhost:5001';

function resolveUrl(raw: string) {
  return raw.startsWith('/') ? `${BACKEND}${raw}` : raw;
}

// ─── HLS Player ──────────────────────────────────────────────────────────────
function HlsVideo({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    // Safari — native HLS
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      return;
    }

    // Chrome / Firefox — hls.js
    let hls: any;
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) { video.src = url; return; }
      hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
    });

    return () => hls?.destroy();
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
}

// ─── Watch Page ───────────────────────────────────────────────────────────────
export default function SeriesWatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: series, isLoading: seriesLoading } = useSeriesDetail(id!);
  const { data: seasons } = useSeasons(id!);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(searchParams.get('seasonId') || null);
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(id!, selectedSeasonId);
  
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    if (seasons?.length && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0]._id);
      setSearchParams({ seasonId: seasons[0]._id }, { replace: true });
    }
  }, [seasons, selectedSeasonId, setSearchParams]);

  useEffect(() => {
    if (episodes?.length) {
      const epId = searchParams.get('episodeId');
      if (epId) {
        const ep = episodes.find((e: any) => e._id === epId);
        if (ep) setSelectedEpisode(ep);
        else setSelectedEpisode(episodes[0]);
      } else {
        setSelectedEpisode(episodes[0]);
      }
    } else {
      setSelectedEpisode(null);
    }
  }, [episodes, searchParams]);

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    setSelectedSeasonId(newSeasonId);
    setSearchParams({ seasonId: newSeasonId });
  };

  const handleEpisodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEpisodeId = e.target.value;
    if (selectedSeasonId) {
      setSearchParams({ seasonId: selectedSeasonId, episodeId: newEpisodeId });
    }
  };

  if (seriesLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: 16 }}>Loading…</div>
      </div>
    );
  }

  // Get first available video URL (ignoring quality for now)
  const rawUrl = selectedEpisode?.videoUrls ? Object.values(selectedEpisode.videoUrls)[0] : null;
  const videoUrl = rawUrl ? resolveUrl(rawUrl as string) : null;

  const selectStyle = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', padding: '6px 28px 6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', appearance: 'none' as const, outline: 'none',
    backdropFilter: 'blur(8px)',
  };
  const wrapperStyle = { position: 'relative' as const, display: 'inline-block' };
  const arrowStyle = { position: 'absolute' as const, right: 10, top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none' as const, fontSize: 10 };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        padding: '14px 24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(`/series/${id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          ← Back
        </button>
        
        {series && (
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 16, letterSpacing: 0.2, marginRight: 'auto' }}>
            {series.title}
          </span>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={wrapperStyle}>
            <select style={selectStyle} value={selectedSeasonId || ''} onChange={handleSeasonChange}>
              {seasons?.map((s: any) => <option key={s._id} value={s._id} style={{ color: '#000' }}>Season {s.seasonNumber}</option>)}
            </select>
            <span style={arrowStyle}>▼</span>
          </div>
          
          <div style={wrapperStyle}>
            <select style={selectStyle} value={selectedEpisode?._id || ''} onChange={handleEpisodeChange} disabled={episodesLoading}>
              {episodes?.map((e: any) => <option key={e._id} value={e._id} style={{ color: '#000' }}>Ep {e.episodeNumber}: {e.title}</option>)}
            </select>
            <span style={arrowStyle}>▼</span>
          </div>
        </div>
      </div>

      {/* ── Player ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100vh' }}>
          {videoUrl ? (
            <HlsVideo url={videoUrl} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#000' }}>
              <span style={{ fontSize: 48, marginBottom: 16 }}>⏳</span>
              <p style={{ color: '#94a3b8', fontSize: 16 }}>Video not available for this episode yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

