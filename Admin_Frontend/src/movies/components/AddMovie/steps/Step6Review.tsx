import { useFormContext } from 'react-hook-form';
import Input from '@/components/ui/Input';
import './Step6Review.css';

const Step6Review = () => {
  const { getValues, register, watch } = useFormContext();
  const values = getValues();
  const status = watch('status');

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  return (
    <div className="step-container step6-review">
      
      <div className="summary-section">
        <h3 className="section-title">Review Movie Details</h3>
        
        <div className="summary-card">
          <div className="summary-poster">
            {values.posterPath ? (
              <img src={getImageUrl(values.posterPath)} alt="Poster" />
            ) : (
              <div className="no-poster">No Poster</div>
            )}
          </div>
          
          <div className="summary-details">
            <h4 className="summary-title">{values.title || 'Untitled Movie'}</h4>
            <div className="summary-meta">
              <span>{values.releaseYear || 'TBA'}</span> • 
              <span>{values.duration || 0} mins</span> • 
              <span>{values.language || 'Unknown Language'}</span> • 
              <span className="rating-badge">{values.contentRating || 'U'}</span>
            </div>
            <p className="summary-desc">{values.description || 'No description provided.'}</p>
            
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Type</span>
                <span className="stat-value">{values.type || 'Movie'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Genres Selected</span>
                <span className="stat-value">{values.genreIds?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Cast Members</span>
                <span className="stat-value">{values.actors?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Video</span>
                <span className="stat-value">{values.videoUrl ? '✅ Uploaded' : '❌ Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="step-divider" />

      <div className="publishing-section">
        <h3 className="section-title">Publishing Strategy</h3>
        
        <div className="status-options">
          <label className={`status-option ${status === 'draft' ? 'selected' : ''}`}>
            <input type="radio" value="draft" {...register('status')} />
            <div className="option-content">
              <h4>Save as Draft</h4>
              <p>Keep it hidden until you manually publish it later.</p>
            </div>
          </label>

          <label className={`status-option ${status === 'published' ? 'selected' : ''}`}>
            <input type="radio" value="published" {...register('status')} />
            <div className="option-content">
              <h4>Publish Now</h4>
              <p>Make it immediately available to all users.</p>
            </div>
          </label>

          <label className={`status-option ${status === 'scheduled' ? 'selected' : ''}`}>
            <input type="radio" value="scheduled" {...register('status')} />
            <div className="option-content">
              <h4>Schedule for Later</h4>
              <p>Automatically publish at a specific date and time.</p>
            </div>
          </label>
        </div>

        {status === 'scheduled' && (
          <div className="schedule-date-picker">
            <Input 
              type="datetime-local" 
              label="Select Publish Date & Time *"
              {...register('publishAt', { valueAsDate: true })}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default Step6Review;
