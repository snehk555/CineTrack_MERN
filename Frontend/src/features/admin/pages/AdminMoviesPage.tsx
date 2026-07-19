import { useState } from 'react';
import { useAdminMovies, useAdminDeleteMovie, useFeatureMovieMutation } from '../hooks/adminQueries';
import { useAddMovieMutation } from '../../movies/hooks/moviesMutations';
import useDebounce from '../../../shared/hooks/useDebounce';
import type { Movie } from '../../../types';

// ─── TMDB Search Modal ────────────────────────────────────────────────────────
interface AddMovieModalProps {
  onClose: () => void;
}

function AddMovieModal({ onClose }: AddMovieModalProps) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const { mutate: addMovie, isPending } = useAddMovieMutation();

  // In Phase 16 — TMDB search results will show here via useQuery
  const handleAdd = () => {
    if (!debouncedQuery || !categoryId) return;
    addMovie({ searchName: debouncedQuery, categoryId, genreIds: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Add Movie via TMDB</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Search Movie Name</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. The Dark Knight"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm outline-none focus:border-violet-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Category ID</label>
            <input
              type="text"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="e.g. 64abc123..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <p className="text-xs text-slate-500">
            💡 TMDB search results dropdown — Phase 16 implementation
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!query || !categoryId || isPending}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isPending ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminMoviesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useAdminMovies({ search: debouncedSearch, status: statusFilter, page });
  const { mutate: deleteMovie, isPending: deleting } = useAdminDeleteMovie();
  const { mutate: featureMovie } = useFeatureMovieMutation();

  const movies: Movie[] = data?.movies ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Movies</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data?.total ?? 0} total movies</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors active:scale-95"
        >
          + Add Movie
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-violet-500 transition-colors w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Title', 'Status', 'Rating', 'Watchlists', 'Added', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/8 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No movies found
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr key={movie._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {movie.posterPath && (
                          <img
                            src={`https://image.tmdb.org/t/p/w45${movie.posterPath}`}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium truncate max-w-[160px]">{movie.title}</p>
                          <p className="text-slate-500 text-xs">{movie.releaseYear}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        movie.processingStatus === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : movie.processingStatus === 'processing'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}>
                        {movie.processingStatus ?? 'pending'}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 text-slate-300">
                      ⭐ {movie.averageRating?.toFixed(1) ?? '—'}
                    </td>

                    {/* Watchlists */}
                    <td className="px-4 py-3 text-slate-400">{movie.watchlistCount ?? 0}</td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(movie.createdAt).toLocaleDateString()}
                    </td>

                    {/* Featured Toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => featureMovie({ id: movie._id })}
                        className={`text-lg transition-all hover:scale-110 ${movie.isFeatured ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}
                        title={movie.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        ⭐
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {confirmDelete === movie._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { deleteMovie(movie._id); setConfirmDelete(null); }}
                            disabled={deleting}
                            className="text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-slate-400 border border-white/10 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(movie._id)}
                          className="text-xs text-slate-400 border border-white/10 px-3 py-1.5 rounded-lg hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Movie Modal */}
      {showAddModal && <AddMovieModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}