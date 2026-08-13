import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, setGenre, setPage, resetFilters } from '../../../store';
import { usePublicSeriesList } from '../hooks/seriesQueries';
import MovieCard from '../../movies/components/MovieCard';
import SkeletonCard from '../../movies/components/SkeletonCard';
import GenreTagBar from '../../../shared/components/ui/GenreTagBar';
import Pagination from '../../../shared/components/ui/Pagination';

export default function SeriesListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useAppSelector((state) => state.filters);

  useEffect(() => {
    const genre = searchParams.get('genre');
    if (genre) dispatch(setGenre(genre));
  }, []);

  const { data, isLoading, isError } = usePublicSeriesList();
  const seriesList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  const handlePage = (p: number) => {
    dispatch(setPage(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <GenreTagBar />
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0 }}>Browse Web Series</h1>
            <p style={{ color: '#52525b', fontSize: 12, margin: '4px 0 0' }}>
              {total} series found
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="ct-episode-select"
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'newest') { dispatch({ type: 'filters/setSortBy', payload: 'createdAt' }); dispatch({ type: 'filters/setOrder', payload: 'desc' }); }
                else if (val === 'rating') { dispatch({ type: 'filters/setSortBy', payload: 'averageRating' }); dispatch({ type: 'filters/setOrder', payload: 'desc' }); }
                else if (val === 'az') { dispatch({ type: 'filters/setSortBy', payload: 'title' }); dispatch({ type: 'filters/setOrder', payload: 'asc' }); }
              }}
              style={{ fontSize: 12 }}
            >
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="az">A–Z</option>
            </select>

            {filters.genre && (
              <button
                onClick={() => dispatch(resetFilters())}
                style={{
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                  color: '#fbbf24', fontSize: 12, fontWeight: 600,
                  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                }}
              >
                ✕ Clear Filter
              </button>
            )}
          </div>
        </div>

        {isError ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40 }}>⚠️</p>
            <p style={{ color: '#52525b' }}>Failed to load series. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="ct-grid-6">
            {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 8 }}>📺</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>No web series found</p>
            <p style={{ color: '#52525b', fontSize: 13 }}>Try selecting a different genre</p>
          </div>
        ) : (
          <div className="ct-grid-6">
            {seriesList.map((s) => (
              <MovieCard
                key={s._id}
                movie={{
                  ...s,
                  title: `${s.title}${s.totalSeasons ? ` (${s.totalSeasons}S)` : ''}`,
                  averageRating: s.averageRating ?? 0,
                  totalRatings: s.totalRatings ?? 0,
                  totalReviews: 0,
                  totalWatchlists: 0,
                  genreIds: s.genreIds ?? [],
                  processingStatus: 'ready',
                  slug: s.slug ?? '',
                }}
                onClick={() => navigate(`/series/${s._id}`)}
              />
            ))}
          </div>
        )}

        {total > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPage={handlePage} alwaysShow={true} />
        )}
      </div>
    </div>
  );
}
