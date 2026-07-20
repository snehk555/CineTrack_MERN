import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/services/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import './GenresPage.css';

interface Genre {
  _id: string;
  name: string;
  slug: string;
  color: string;
  movieCount: number;
}

// Preset color palette
const PRESET_COLORS = [
  '#f59e0b','#ef4444','#3b82f6','#22c55e','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#06b6d4','#a855f7',
];

const genreApi = {
  list:   () => apiClient.get<{ success: boolean; data: Genre[] }>('/v1/admin/genres'),
  create: (d: { name: string; color: string }) => apiClient.post('/v1/admin/genres', d),
  update: (id: string, d: { name?: string; color?: string }) => apiClient.patch(`/v1/admin/genres/${id}`, d),
  delete: (id: string) => apiClient.delete(`/v1/admin/genres/${id}`),
};

const GenresPage = () => {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]     = useState(false);
  const [newName, setNewName]     = useState('');
  const [newColor, setNewColor]   = useState('#f59e0b');
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState('');

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['admin-genres'],
    queryFn:  () => genreApi.list().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => genreApi.create({ name: newName.trim(), color: newColor }),
    onSuccess:  () => { toast.success('Genre created'); qc.invalidateQueries({ queryKey: ['admin-genres'] }); setShowAdd(false); setNewName(''); },
    onError:    (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => genreApi.update(id, { name }),
    onSuccess:  () => { toast.success('Genre updated'); qc.invalidateQueries({ queryKey: ['admin-genres'] }); setEditId(null); },
    onError:    () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => genreApi.delete(id),
    onSuccess:  () => { toast.success('Genre deleted'); qc.invalidateQueries({ queryKey: ['admin-genres'] }); },
    onError:    (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  return (
    <div className="genres-page">
      <div className="genres-page__header">
        <div>
          <h1>Genres</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {genres.length} genres · all dynamic from database
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Add Genre</Button>
      </div>

      {/* Add Genre Form */}
      {showAdd && (
        <div className="genre-add-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>New Genre</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Input
              label="Genre name"
              placeholder="e.g. Sci-Fi"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Color</label>
              <div className="genre-color-grid">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={`genre-color-swatch ${newColor === c ? 'genre-color-swatch--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!newName.trim()}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => { setShowAdd(false); setNewName(''); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Genre Grid */}
      {isLoading ? (
        <div className="genres-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="genre-card genre-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="genres-grid">
          {genres.map(g => (
            <div key={g._id} className="genre-card">
              <div className="genre-card__top">
                <span className="genre-card__dot" style={{ background: g.color }} />
                {editId === g._id ? (
                  <input
                    className="genre-card__edit-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') updateMutation.mutate({ id: g._id, name: editName });
                      if (e.key === 'Escape') setEditId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="genre-card__name">{g.name}</span>
                )}
              </div>
              <div className="genre-card__meta">
                <span className="genre-card__count">{g.movieCount} movies</span>
                <div className="genre-card__actions">
                  {editId === g._id ? (
                    <>
                      <button className="genre-action genre-action--save" onClick={() => updateMutation.mutate({ id: g._id, name: editName })}>✓</button>
                      <button className="genre-action" onClick={() => setEditId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <button className="genre-action" onClick={() => { setEditId(g._id); setEditName(g.name); }} title="Edit">✎</button>
                      <button
                        className="genre-action genre-action--danger"
                        onClick={() => deleteMutation.mutate(g._id)}
                        disabled={g.movieCount > 0}
                        title={g.movieCount > 0 ? `${g.movieCount} movies use this genre` : 'Delete genre'}
                      >✕</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenresPage;
