import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useSeriesDetail,
  useSeasons,
  useEpisodes,
  useFetchTmdbEpisodeData,
  useUpdateEpisodeStatus,
} from '../hooks/seriesQueries';
import AddEpisodeModal from '../components/AddEpisode/AddEpisodeModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';

import './SeriesDashboard.css';

const EPISODES_PER_PAGE = 8;

const getImageUrl = (path?: string, size = 'w185') => {
  if (!path) return '';
  return path.startsWith('http')
    ? path.replace('original', size)
    : `https://image.tmdb.org/t/p/${size}${path}`;
};

const getYear = (date?: string) => {
  if (!date) return 'Unknown';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? 'Unknown' : year;
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const SeriesDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: seriesRes, isLoading: seriesLoading } = useSeriesDetail(id!);
  const { data: seasonsRes, isLoading: seasonsLoading } = useSeasons(id!);

  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  // Global episode addition states
  const [isFetchEpisodeOpen, setIsFetchEpisodeOpen] = useState(false);
  const [fetchSeasonNumber, setFetchSeasonNumber] = useState(1);
  const [fetchEpisodeNumber, setFetchEpisodeNumber] = useState(1);
  const [selectedEpisodeData, setSelectedEpisodeData] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { mutate: fetchTmdbEpisode, isPending: fetchingEpisode } = useFetchTmdbEpisodeData();

  const handleGlobalFetchEpisode = () => {
    fetchTmdbEpisode(
      { seriesId: id!, seasonNumber: fetchSeasonNumber, episodeNumber: fetchEpisodeNumber },
      {
        onSuccess: (res) => {
          setIsFetchEpisodeOpen(false);
          setSelectedEpisodeData(res.data);
          setIsAddModalOpen(true);
        },
        onError: (err: any) =>
          toast.error(err.response?.data?.message || 'Failed to fetch TMDB episode'),
      }
    );
  };

  const series = seriesRes?.data;
  const seasons: any[] = seasonsRes?.data || [];

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      next.has(seasonId) ? next.delete(seasonId) : next.add(seasonId);
      return next;
    });
  };

  if (seriesLoading || seasonsLoading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner" />
        Loading series dashboard…
      </div>
    );
  }

  if (!series) {
    return <div className="sd-error">Series not found</div>;
  }

  return (
    <div className="series-dashboard">
      <div className="sd-hero">
        <div className="sd-hero__left">
          <button className="sd-back-btn" onClick={() => navigate('/series')}>
            ← Back
          </button>
          {series.posterPath ? (
            <img
              src={getImageUrl(series.posterPath, 'w185')}
              alt={series.title}
              className="sd-hero__poster"
            />
          ) : (
            <div className="sd-hero__poster sd-hero__poster--empty">No Poster</div>
          )}
          <div className="sd-hero__info">
            <h1 className="sd-hero__title">{series.title}</h1>
            <p className="sd-hero__meta">
              <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
              <span className="sd-dot">•</span>
              <span>⭐ {series.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="sd-dot">•</span>
              <span className={`sd-status sd-status--${series.status}`}>{series.status}</span>
            </p>
            {series.overview && (
              <p className="sd-hero__overview">{series.overview}</p>
            )}
          </div>
        </div>

        <button className="sd-fetch-btn" onClick={() => setIsFetchEpisodeOpen(true)}>
          <span className="sd-fetch-btn__icon">⬇</span>
          Fetch Episode from TMDB
        </button>
      </div>

      <div className="sd-seasons">
        {seasons.length === 0 ? (
          <div className="sd-empty">
            <div className="sd-empty__icon">📺</div>
            <p>No seasons added yet.</p>
            <button className="sd-fetch-btn" onClick={() => setIsFetchEpisodeOpen(true)} style={{ marginTop: '1rem' }}>
              <span className="sd-fetch-btn__icon">⬇</span>
              Fetch First Episode
            </button>
          </div>
        ) : (
          seasons.map((season: any) => (
            <SeasonAccordion
              key={season._id}
              season={season}
              seriesId={id!}
              isOpen={expandedSeasons.has(season._id)}
              onToggle={() => toggleSeason(season._id)}
              onOpenEpisodeModal={(data: any) => {
                setSelectedEpisodeData(data);
                setIsAddModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {isFetchEpisodeOpen && (
        <div className="sd-overlay">
          <div className="sd-modal">
            <div className="sd-modal__head">
              <div>
                <h2>Fetch Episode from TMDB</h2>
                <p>Enter season and episode number to fetch its details.</p>
              </div>
              <button className="sd-modal__close" onClick={() => setIsFetchEpisodeOpen(false)}>
                ×
              </button>
            </div>
            <div className="sd-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <Input label="Season Number" type="number" value={fetchSeasonNumber} onChange={(e) => setFetchSeasonNumber(Number(e.target.value))} />
               <Input label="Episode Number" type="number" value={fetchEpisodeNumber} onChange={(e) => setFetchEpisodeNumber(Number(e.target.value))} />
            </div>
            <div className="sd-modal__actions">
              <Button variant="outline" onClick={() => setIsFetchEpisodeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGlobalFetchEpisode} loading={fetchingEpisode}>
                Fetch & Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Episode Modal */}
      <AddEpisodeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEpisodeData(null);
        }}
        seriesId={id!}
        tmdbEpisodeData={selectedEpisodeData}
      />
    </div>
  );
};

const SeasonAccordion = ({
  season,
  seriesId,
  isOpen,
  onToggle,
  onOpenEpisodeModal
}: {
  season: any;
  seriesId: string;
  isOpen: boolean;
  onToggle: () => void;
  onOpenEpisodeModal: (data: any) => void;
}) => {
  const { data: episodesRes, isLoading } = useEpisodes(seriesId, season._id);
  const dbEpisodes: any[] = episodesRes?.data || [];

  const [draftEpisodes, setDraftEpisodes] = useState<any[]>([]);
  const { mutate: fetchTmdbEpisode } = useFetchTmdbEpisodeData();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateEpisodeStatus();

  const allEpisodes = [...dbEpisodes, ...draftEpisodes];

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // No local filtering, just pagination (if we even want pagination, let's keep it for db episodes)
  const totalPages = Math.max(1, Math.ceil(allEpisodes.length / EPISODES_PER_PAGE));
  const episodes = allEpisodes.slice((page - 1) * EPISODES_PER_PAGE, page * EPISODES_PER_PAGE);

  const handleSearch = (val: string) => {
    setSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const episodeNum = parseInt(search.trim(), 10);
      if (!isNaN(episodeNum)) {
        fetchTmdbEpisode(
          { seriesId, seasonNumber: season.seasonNumber, episodeNumber: episodeNum },
          {
            onSuccess: (res) => {
              const tmdbData = res.data;
              toast.success(`Fetched TMDB Episode ${episodeNum} data!`);
              if (!draftEpisodes.find(ep => ep.episode_number === episodeNum) && 
                  !dbEpisodes.find(ep => ep.episodeNumber === episodeNum)) {
                
                const newDraft = {
                  _id: `draft-${Date.now()}`,
                  isDraft: true,
                  episodeNumber: tmdbData.episode_number,
                  title: tmdbData.name,
                  runtime: tmdbData.runtime,
                  thumbnailUrl: tmdbData.still_path ? `https://image.tmdb.org/t/p/original${tmdbData.still_path}` : undefined,
                  processingStatus: 'draft',
                  videoUrls: {},
                  tmdbRawData: tmdbData
                };
                setDraftEpisodes(prev => [...prev, newDraft]);
              }
              setSearch('');
            },
            onError: (err: any) => {
              toast.error(err.response?.data?.message || 'Failed to fetch TMDB episode');
            }
          }
        );
      }
    }
  };

  return (
    <div className={`sd-accordion ${isOpen ? 'sd-accordion--open' : ''}`}>
      <button className="sd-accordion__head" onClick={onToggle}>
        <div className="sd-accordion__left">
          {season.posterPath ? (
            <img
              src={getImageUrl(season.posterPath, 'w92')}
              alt={season.title}
              className="sd-accordion__poster"
            />
          ) : (
            <div className="sd-accordion__poster sd-accordion__poster--empty">
              S{season.seasonNumber}
            </div>
          )}
          <div>
            <div className="sd-accordion__title">
              Season {season.seasonNumber}: {season.title || `Season ${season.seasonNumber}`}
            </div>
            <div className="sd-accordion__meta">
              {season.episodeCount || allEpisodes.length} Episodes
              {season.airDate ? ` • Aired ${getYear(season.airDate)}` : ''}
            </div>
          </div>
        </div>
        <div className="sd-accordion__right">
          <span className={`sd-chevron ${isOpen ? 'sd-chevron--up' : ''}`}>▾</span>
        </div>
      </button>

      {isOpen && (
        <div className="sd-accordion__body">
          <div className="sd-ep-toolbar">
            <div className="sd-ep-search">
              <Input
                placeholder="Type episode number & press Enter to fetch from TMDB..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <span className="sd-ep-count">
              {allEpisodes.length} episode{allEpisodes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="sd-ep-loading">Loading episodes…</div>
          ) : episodes.length === 0 ? (
            <div className="sd-ep-empty">
              No episodes found for this season.
            </div>
          ) : (
            <div className="sd-ep-list">
              {/* Table Headers */}
              <div className="sd-ep-grid sd-ep-grid--header">
                <div>Title</div>
                <div>Video Status</div>
                <div>Date Added</div>
                <div>Publish Status</div>
                <div className="sd-col-right">Actions</div>
              </div>
              
              {episodes.map((episode: any) => {
                const isReady = episode.processingStatus === 'ready';
                const statusColor = 
                  episode.status === 'published' ? '#10b981' : 
                  episode.status === 'scheduled' ? '#3b82f6' : 
                  '#94a3b8';
                const statusBg =
                  episode.status === 'published' ? 'rgba(16,185,129,0.1)' :
                  episode.status === 'scheduled' ? 'rgba(59,130,246,0.1)' :
                  'rgba(148,163,184,0.1)';
                const statusBorder =
                  episode.status === 'published' ? 'rgba(16,185,129,0.25)' :
                  episode.status === 'scheduled' ? 'rgba(59,130,246,0.25)' :
                  'rgba(148,163,184,0.25)';

                return (
                  <div key={episode._id} className="sd-ep-grid sd-ep-grid--row">
                    
                    {/* Col 1: Title */}
                    <div className="sd-ep-title-col">
                      <span className="sd-ep-num">E{episode.episodeNumber}</span>
                      <span className="sd-ep-title-text">{episode.title}</span>
                    </div>

                    {/* Col 2: Video Status */}
                    <div className="sd-ep-vstatus-col">
                      {!episode.isDraft && episode.processingStatus ? (
                        <span className={`sd-vstatus sd-vstatus--${episode.processingStatus}`}>
                          <span className="sd-vstatus__dot" />
                          {episode.processingStatus.toUpperCase()}
                        </span>
                      ) : (
                        <span className="sd-vstatus sd-vstatus--none">—</span>
                      )}
                    </div>

                    {/* Col 3: Date Added */}
                    <div className="sd-ep-date-col">
                      {episode.createdAt ? new Date(episode.createdAt).toLocaleDateString() : '—'}
                    </div>

                    {/* Col 4: Publish Status */}
                    <div className="sd-ep-pstatus-col">
                      {episode.isDraft ? (
                        <span className="sd-pub-badge sd-pub-badge--unsaved">UNSAVED</span>
                      ) : (
                        <div className="sd-pub-wrap">
                          <span className="sd-pub-badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                            {episode.status?.toUpperCase() || 'DRAFT'}
                          </span>
                          {episode.status === 'scheduled' && episode.publishAt && (
                            <span className="sd-pub-time">
                              {new Date(episode.publishAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Col 5: Actions */}
                    <div className="sd-ep-actions-col">
                      <button
                        className="sd-action-btn sd-action-btn--edit"
                        onClick={() => {
                          if (episode.isDraft) {
                            onOpenEpisodeModal(episode.tmdbRawData);
                          } else {
                            onOpenEpisodeModal({
                              season_number: season.seasonNumber,
                              episode_number: episode.episodeNumber,
                              name: episode.title,
                              overview: episode.overview,
                              runtime: episode.runtime,
                              still_path: episode.thumbnailUrl ? episode.thumbnailUrl.replace('https://image.tmdb.org/t/p/original', '') : ''
                            });
                          }
                        }}
                      >
                        {episode.isDraft ? 'Setup' : 'Edit'}
                      </button>

                      {!episode.isDraft && (
                        episode.status !== 'published' ? (
                          <button
                            className={`sd-action-btn sd-action-btn--publish${!isReady ? ' sd-action-btn--disabled' : ''}`}
                            disabled={!isReady || isUpdatingStatus}
                            onClick={() => updateStatus({ episodeId: episode._id, status: 'published' })}
                            title={!isReady ? 'Video must be ready to publish' : ''}
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            className="sd-action-btn sd-action-btn--unpublish"
                            disabled={isUpdatingStatus}
                            onClick={() => updateStatus({ episodeId: episode._id, status: 'draft' })}
                          >
                            Unpublish
                          </button>
                        )
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="sd-pagination">
              <button
                className="sd-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="sd-page-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="sd-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export default SeriesDashboard;
