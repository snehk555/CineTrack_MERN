import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import apiClient from '@/services/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AddMovieModal from '../components/AddMovie/AddMovieModal';
import './MoviesPage.css';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Genre { _id: string; name: string; color: string; }
interface Movie {
  _id: string;
  title: string;
  posterPath?: string;
  status: 'published' | 'draft' | 'archived';
  isFeatured: boolean;
  averageRating: number;
  totalWatchlists: number;
  genreIds: Genre[];
  processingStatus: string;
  createdAt: string;
}

interface MovieList {
  data: Movie[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── API ───────────────────────────────────────────────────────────────────
const moviesApi = {
  list: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient.get<{ success: boolean; data: MovieList }>(`/v1/admin/movies/v2?${qs}`);
  },
  setStatus:   (id: string, status: string) => apiClient.patch(`/v1/admin/movies/v2/${id}/status`, { status }),
  toggleFeat:  (id: string) => apiClient.patch(`/v1/admin/movies/v2/${id}/feature`, {}),
  delete:      (id: string) => apiClient.delete(`/v1/admin/movies/v2/${id}`),
  bulk:        (ids: string[], action: string) => apiClient.post('/v1/admin/movies/bulk', { ids, action }),
};

// ─── Status Badge ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  published: { color: 'var(--success)',  label: 'Published' },
  draft:     { color: 'var(--warning)',  label: 'Draft' },
  archived:  { color: 'var(--text-muted)', label: 'Archived' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['draft'];
  return <span className="status-badge" style={{ color: s.color, borderColor: `${s.color}40` }}>{s.label}</span>;
};

// ─── Column helper ────────────────────────────────────────────────────────
const col = createColumnHelper<Movie>();

// ─── Movies Page ─────────────────────────────────────────────────────────
const MoviesPage = () => {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rowSel, setRowSel] = useState<RowSelectionState>({});
  const [searchInput, setSearchInput] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Debounce search
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    const t = setTimeout(() => { setSearch(val); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, []);

  const queryKey = ['admin-movies', page, search, status];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => moviesApi.list({ page, limit: 20, ...(search && { search }), ...(status && { status }) })
      .then(r => r.data.data),
  });

  const publishMutation  = useMutation({ mutationFn: (id: string) => moviesApi.setStatus(id, 'published'), onSuccess: () => { toast.success('Published'); qc.invalidateQueries({ queryKey: ['admin-movies'] }); } });
  const unpublishMutation= useMutation({ mutationFn: (id: string) => moviesApi.setStatus(id, 'draft'),     onSuccess: () => { toast.success('Unpublished'); qc.invalidateQueries({ queryKey: ['admin-movies'] }); } });
  const featMutation     = useMutation({ mutationFn: (id: string) => moviesApi.toggleFeat(id),             onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-movies'] }); } });
  const deleteMutation   = useMutation({ mutationFn: (id: string) => moviesApi.delete(id),                 onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-movies'] }); } });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: string }) => moviesApi.bulk(ids, action),
    onSuccess: (_, vars) => {
      toast.success(`Bulk ${vars.action} done`);
      qc.invalidateQueries({ queryKey: ['admin-movies'] });
      setRowSel({});
    },
  });

  const selectedIds = Object.keys(rowSel).filter(k => rowSel[k]);

  const columns = [
    col.display({
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      ),
      size: 40,
    }),
    col.accessor('title', {
      header: 'Title',
      cell: info => (
        <div className="movie-title-cell">
          {info.row.original.posterPath && (
            <img src={`https://image.tmdb.org/t/p/w92${info.row.original.posterPath}`} alt="" className="movie-thumb" />
          )}
          <span className="movie-title-text">{info.getValue()}</span>
        </div>
      ),
    }),
    col.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 110,
    }),
    col.accessor('genreIds', {
      header: 'Genres',
      cell: info => (
        <div className="genre-badges">
          {info.getValue().slice(0, 2).map(g => (
            <span key={g._id} className="genre-mini-badge" style={{ color: g.color, borderColor: `${g.color}40` }}>{g.name}</span>
          ))}
          {info.getValue().length > 2 && <span className="genre-mini-badge">+{info.getValue().length - 2}</span>}
        </div>
      ),
      size: 160,
    }),
    col.accessor('averageRating', {
      header: 'Rating',
      cell: info => <span className="mono-text">★ {info.getValue().toFixed(1)}</span>,
      size: 80,
    }),
    col.accessor('totalWatchlists', {
      header: 'Watchlists',
      cell: info => <span className="mono-text">{info.getValue().toLocaleString()}</span>,
      size: 100,
    }),
    col.accessor('isFeatured', {
      header: 'Featured',
      cell: info => (
        <button
          className={`feat-toggle ${info.getValue() ? 'feat-toggle--on' : ''}`}
          onClick={() => featMutation.mutate(info.row.original._id)}
          title={info.getValue() ? 'Unfeature' : 'Feature'}
        >
          {info.getValue() ? '★' : '☆'}
        </button>
      ),
      size: 80,
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="row-actions">
            {m.status !== 'published'
              ? <button className="row-btn row-btn--publish" onClick={() => publishMutation.mutate(m._id)}>Publish</button>
              : <button className="row-btn row-btn--unpublish" onClick={() => unpublishMutation.mutate(m._id)}>Unpublish</button>
            }
            <button className="row-btn row-btn--delete" onClick={() => { if (confirm(`Delete "${m.title}"?`)) deleteMutation.mutate(m._id); }}>Delete</button>
          </div>
        );
      },
      size: 160,
    }),
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { rowSelection: rowSel },
    onRowSelectionChange: setRowSel,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row._id,
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
  });

  return (
    <div className="movies-page">
      <div className="movies-page__header">
        <div>
          <h1>Movies</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {data?.total?.toLocaleString() ?? '—'} total movies
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>+ Add Movie</Button>
      </div>

      {/* Filters */}
      <div className="movies-filters">
        <Input
          placeholder="Search title..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select
          className="filter-select"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        {selectedIds.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedIds.length} selected</span>
            <button className="bulk-btn" onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'publish' })}>Publish</button>
            <button className="bulk-btn" onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'unpublish' })}>Unpublish</button>
            <button className="bulk-btn bulk-btn--danger" onClick={() => { if (confirm(`Delete ${selectedIds.length} movies?`)) bulkMutation.mutate({ ids: selectedIds, action: 'delete' }); }}>Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} style={{ width: h.column.columnDef.size }}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {columns.map((_, ci) => <td key={ci}><div className="cell-skeleton" /></td>)}
                </tr>
              ))
              : table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.getIsSelected() ? 'row--selected' : ''}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
        <span className="page-info">Page {page} of {data?.totalPages ?? 1}</span>
        <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)}>Next →</button>
      </div>

      <AddMovieModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default MoviesPage;
