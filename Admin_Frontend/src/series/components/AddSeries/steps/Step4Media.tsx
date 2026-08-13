import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import { useUploadImage } from '@/movies/hooks/moviesQueries';
import { tmdbApi } from '@/movies/services/api';
import '@/movies/components/AddMovie/steps/Step4Media.css';

interface Props {
  /** Pass TMDB ID to enable 'Re-fetch from TMDB' button */
  seriesTmdbId?: number;
}

const Step4Media = ({ seriesTmdbId }: Props) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { mutate: uploadImage } = useUploadImage();
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);

  const posterPath = watch('posterPath');
  const bannerPath = watch('bannerPath');

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/original${path}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'poster' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type} to Cloudinary...`);
    uploadImage({ file, type }, {
      onSuccess: (res) => {
        toast.success(`${type} uploaded successfully`, { id: toastId });
        setValue(fieldName, res.data.url, { shouldValidate: true });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to upload ${type}`, { id: toastId });
      }
    });
    e.target.value = '';
  };

  const handleRefetchTmdb = async () => {
    if (!seriesTmdbId) {
      toast.error('No TMDB ID found for this series.');
      return;
    }
    setIsFetchingTmdb(true);
    try {
      const res = await tmdbApi.getDetails(seriesTmdbId, 'tv');
      if (res.success && res.data) {
        const d = res.data;
        if (d.posterPath) {
          setValue('posterPath', d.posterPath, { shouldValidate: true });
          toast.success('Poster updated from TMDB!');
        }
        if (d.backdropPath) {
          setValue('bannerPath', d.backdropPath, { shouldValidate: true });
          toast.success('Banner updated from TMDB!');
        }
      } else {
        toast.error('Could not fetch data from TMDB.');
      }
    } catch {
      toast.error('Failed to fetch from TMDB.');
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  return (
    <div className="step-container step4-media">

      {/* TMDB Re-fetch banner */}
      {seriesTmdbId && (
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontWeight: 600, color: '#818cf8', fontSize: '13px' }}>🎬 TMDB ID: {seriesTmdbId}</span>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>Click to fetch the latest poster & banner from TMDB automatically.</p>
          </div>
          <button
            type="button"
            onClick={handleRefetchTmdb}
            disabled={isFetchingTmdb}
            style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: isFetchingTmdb ? 0.6 : 1 }}
          >
            {isFetchingTmdb ? '⏳ Fetching...' : '↻ Re-fetch from TMDB'}
          </button>
        </div>
      )}

      <div className="media-grid">
        {/* Poster Section */}
        <div className="media-upload-section">
          <h3 className="section-title">Poster Image *</h3>
          <p className="section-subtitle">Primary series poster (Vertical)</p>
          
          <div className="image-preview-container poster-preview">
            {posterPath ? (
              <img src={getImageUrl(posterPath)} alt="Poster Preview" />
            ) : (
              <div className="empty-preview">
                <span className="icon">📸</span>
                <span>No poster selected</span>
              </div>
            )}
          </div>
          
          <div className="input-with-upload">
            <Input 
              placeholder="Paste image URL or TMDB path..."
              {...register('posterPath')} 
              error={errors.posterPath?.message as string} 
              hint="Paste a URL directly, upload a file, or re-fetch from TMDB above"
            />
            <label className="upload-btn" title="Upload from your computer">
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'posterPath', 'poster')} hidden />
              <span>📁 Upload</span>
            </label>
          </div>
        </div>

        {/* Banner Section */}
        <div className="media-upload-section">
          <h3 className="section-title">Banner Image</h3>
          <p className="section-subtitle">Background banner (Horizontal)</p>
          
          <div className="image-preview-container banner-preview">
            {bannerPath ? (
              <img src={getImageUrl(bannerPath)} alt="Banner Preview" />
            ) : (
              <div className="empty-preview">
                <span className="icon">🖼️</span>
                <span>No banner selected</span>
              </div>
            )}
          </div>
          
          <div className="input-with-upload">
            <Input 
              placeholder="Paste image URL or TMDB path..."
              {...register('bannerPath')} 
              error={errors.bannerPath?.message as string} 
            />
            <label className="upload-btn" title="Upload from your computer">
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bannerPath', 'banner')} hidden />
              <span>📁 Upload</span>
            </label>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Step4Media;
