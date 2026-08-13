import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../features/watchlist/hooks/watchlistQueries';
import MovieCard from '../features/movies/components/MovieCard';
import SkeletonCard from '../features/movies/components/SkeletonCard';
import Pagination from '../shared/components/ui/Pagination';
import type { WatchlistEntry, Movie } from '../types';

const ITEMS_PER_PAGE = 12;

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { data: watchlist, isLoading } = useWatchlist();
  
  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState('');

  // Filter watchlist items
  const filteredWatchlist = useMemo(() => {
    if (!watchlist) return [];
    if (!monthFilter) return watchlist;
    
    return watchlist.filter(entry => {
      const addedDate = new Date(entry.createdAt);
      const yyyy = addedDate.getFullYear();
      const mm = String(addedDate.getMonth() + 1).padStart(2, '0');
      const entryMonth = `${yyyy}-${mm}`;
      return entryMonth === monthFilter;
    });
  }, [watchlist, monthFilter]);

  // Paginate items
  const totalPages = Math.ceil(filteredWatchlist.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredWatchlist.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWatchlist, page]);

  // Handle page change safely
  const handlePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate month options dynamically based on watchlist items
  const monthOptions = useMemo(() => {
    if (!watchlist) return [];
    const months = new Set<string>();
    watchlist.forEach(entry => {
      const date = new Date(entry.createdAt);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      months.add(`${yyyy}-${mm}`);
    });
    // Sort descending
    return Array.from(months).sort().reverse().map(val => {
      const [y, m] = val.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1);
      return {
        value: val,
        label: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    });
  }, [watchlist]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header with Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">My Watchlist</h1>
            <p className="text-slate-400 text-sm">
              {filteredWatchlist.length} movies saved
            </p>
          </div>
          
          {monthOptions.length > 0 && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-xl">📅</span>
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setPage(1); // Reset to page 1 on filter
                }}
                className="bg-transparent text-white text-sm outline-none cursor-pointer [&>option]:bg-[#1a1a2e]"
              >
                <option value="">All Months</option>
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>



        {/* Grid */}
        {isLoading ? (
          <div className="ct-grid-6">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-white text-lg font-medium">Your watchlist is empty</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">Start adding movies you want to watch</p>
            <button
              onClick={() => navigate('/movies')}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <>
            <div className="ct-grid-6 mb-8">
              {paginatedItems.map((entry: WatchlistEntry) => {
                const movie = entry.movieId as Movie;
                return typeof movie === 'object' ? (
                  <MovieCard
                    key={entry._id}
                    movie={movie}
                    onClick={() => navigate(`/movies/${movie._id}`)}
                    dateOverride={entry.createdAt}
                  />
                ) : null;
              })}
            </div>
            
            {/* Pagination Controls */}
            <Pagination 
              page={page} 
              totalPages={totalPages} 
              onPage={handlePage} 
              alwaysShow={true} 
            />
          </>
        )}
      </div>
    </div>
  );
}
