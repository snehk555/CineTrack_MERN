import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, setGenre, setPage, resetFilters } from '../../../store';
import { useMovies } from '../hooks/moviesQueries';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import GenreTagBar from '../../../shared/components/ui/GenreTagBar';
import Pagination from '../../../shared/components/ui/Pagination';

export default function MoviesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useAppSelector((state) => state.filters);

  // Sync URL params → Redux on mount
  useEffect(() => {
    const genre = searchParams.get('genre');
    if (genre) dispatch(setGenre(genre));
    // year filter not yet in redux — handled via search
  }, []);

  const { data, isLoading, isError } = useMovies();
  const movies = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  const handlePage = (p: number) => {
    dispatch(setPage(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e' }}>
      {/* Genre tag bar */}
      <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <GenreTagBar />
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0 }}>Browse Movies</h1>
            <p style={{ color: '#52525b', fontSize: 12, margin: '4px 0 0' }}>
              {total} movies found
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sort select */}
            <select
              className="ct-episode-select"
              onChange={(e) => {
                // handled through redux setSortBy/setOrder
                const val = e.target.value;
                if (val === 'newest') { dispatch({ type: 'filters/setSortBy', payload: 'createdAt' }); dispatch({ type: 'filters/setOrder', payload: 'desc' }); }
                else if (val === 'rating') { dispatch({ type: 'filters/setSortBy', payload: 'rating' }); dispatch({ type: 'filters/setOrder', payload: 'desc' }); }
                else if (val === 'az') { dispatch({ type: 'filters/setSortBy', payload: 'title' }); dispatch({ type: 'filters/setOrder', payload: 'asc' }); }
                else if (val === 'year') { dispatch({ type: 'filters/setSortBy', payload: 'releaseYear' }); dispatch({ type: 'filters/setOrder', payload: 'desc' }); }
              }}
              style={{ fontSize: 12 }}
            >
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="az">A–Z</option>
              <option value="year">By Year</option>
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

        {/* Grid */}
        {isError ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40 }}>⚠️</p>
            <p style={{ color: '#52525b' }}>Failed to load movies. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="ct-grid-6">
            {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 8 }}>🎬</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>No movies found</p>
            <p style={{ color: '#52525b', fontSize: 13 }}>Try selecting a different genre</p>
          </div>
        ) : (
          <div className="ct-grid-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onClick={() => navigate(`/movies/${movie._id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPage={handlePage} alwaysShow={true} />
        )}
      </div>
    </div>
  );
}
