import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, setCategory, setGenre, setSortBy, setOrder, resetFilters } from '../../../store';
import { useInfiniteMovies } from '../hooks/moviesQueries';
import { useCategories, useGenres } from '../hooks/moviesQueries';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';

export default function MoviesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const filters = useAppSelector((state) => state.filters);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteMovies();
  const { data: categories } = useCategories();
  const { data: genres } = useGenres();

  // Intersection Observer for infinite scroll trigger
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const allMovies = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Browse Movies</h1>
            <p className="text-slate-400 text-sm mt-1">
              {data?.pages[0]?.total ?? 0} movies found
            </p>
          </div>
          {(filters.category || filters.genre || filters.search) && (
            <button
              onClick={() => dispatch(resetFilters())}
              className="text-sm text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={filters.category}
            onChange={(e) => dispatch(setCategory(e.target.value))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Categories</option>
            {categories?.map((c: { _id: string; name: string }) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filters.genre}
            onChange={(e) => dispatch(setGenre(e.target.value))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Genres</option>
            {genres?.map((g: { _id: string; name: string }) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [field, ord] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.order];
              dispatch(setSortBy(field));
              dispatch(setOrder(ord));
            }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-amber-500 transition-colors"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="title-asc">A–Z</option>
            <option value="releaseYear-desc">Latest Release</option>
          </select>
        </div>

        {/* Grid */}
        {isError ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-slate-400">Failed to load movies. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allMovies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-white text-lg font-medium">No movies found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allMovies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onClick={() => navigate(`/movies/${movie._id}`)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}