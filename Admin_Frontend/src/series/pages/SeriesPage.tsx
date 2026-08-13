import { useState } from 'react';
import { useSeriesList } from '../hooks/seriesQueries';
import { seriesApi } from '../services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import AddSeriesModal from '../components/AddSeries/AddSeriesModal';
import { toast } from 'sonner';
import '@/movies/pages/MoviesPage.css'; // Reusing CSS

const SeriesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const { data, isLoading } = useSeriesList({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const series = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const formatPoster = (posterPath?: string) => {
    if (!posterPath) return '';
    return posterPath.startsWith('http') ? posterPath.replace('original', 'w92') : `https://image.tmdb.org/t/p/w92${posterPath}`;
  };

  const openAdd = () => {
    setEditingSeries(null);
    setIsModalOpen(true);
  };

  // Fetch full details before opening edit modal
  const openEdit = async (s: any) => {
    setEditLoadingId(s._id);
    try {
      const res = await seriesApi.getDetails(s._id);
      const fullData = res?.data || res;
      setEditingSeries(fullData);
      setIsModalOpen(true);
    } catch {
      toast.error('Failed to load series details for editing.');
    } finally {
      setEditLoadingId(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSeries(null);
  };


  return (
    <div className="movies-page">
      <div className="movies-page__header">
        <div>
          <h1>Web Series</h1>
          <p className="movies-page__subtitle">
            {total.toLocaleString()} total series
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Series</Button>
      </div>

      <div className="movies-filters">
        <Input 
          placeholder="Search series by title..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Poster</th>
              <th>Title</th>
              <th>Genres</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Seasons</th>
              <th>Added</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">Loading series...</td>
              </tr>
            ) : series.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">No series found.</td>
              </tr>
            ) : (
              series.map((s: any) => (
                <tr key={s._id}>
                  <td>
                    {s.posterPath ? (
                      <img src={formatPoster(s.posterPath)} alt="" style={{ objectFit: 'cover', width: '45px', height: '65px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                    ) : (
                      <div className="movie-thumb series-thumb-placeholder" style={{ width: '45px', height: '65px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>No</div>
                    )}
                  </td>
                  <td>
                    <div className="movie-title-text" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.title}</div>
                  </td>
                  <td>
                    <div className="series-title-meta" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {s.genreIds?.map((g: any) => g.name).join(', ') || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${s.status}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>⭐ {s.averageRating?.toFixed(1) || 'N/A'}</td>
                  <td>{s.totalSeasons || 0}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEdit(s)}
                        loading={editLoadingId === s._id}
                        disabled={!!editLoadingId}
                      >
                        ✏️ Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/series/${s._id}`)}>
                        Manage Seasons
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <AddSeriesModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        editData={editingSeries}
      />
    </div>
  );
};

export default SeriesPage;
