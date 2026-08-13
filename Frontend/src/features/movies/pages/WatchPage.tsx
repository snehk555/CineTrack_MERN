import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '../hooks/moviesQueries';

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
export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: movie, isLoading } = useMovieDetail(id ?? '');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: 16 }}>Loading…</div>
      </div>
    );
  }

  if (!movie || movie.processingStatus !== 'ready') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span style={{ fontSize: 48 }}>⏳</span>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>This movie is not available yet.</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Back to details
        </button>
      </div>
    );
  }

  const rawUrl = Object.values(movie.videoUrls || {})[0] ?? '';
  const videoUrl = resolveUrl(rawUrl);

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          ← Back
        </button>
        <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>
          {movie.title}
        </span>
      </div>

      {/* ── Player ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100vh' }}>
          <HlsVideo url={videoUrl} />
        </div>
      </div>
    </div>
  );
}
