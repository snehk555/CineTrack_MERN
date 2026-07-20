import { useFormContext, useFieldArray } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUploadImage } from '../../../hooks/moviesQueries';
import { toast } from 'sonner';
import './Step4Media.css';

const Step4Media = () => {
  const { register, watch, control, setValue, formState: { errors } } = useFormContext();
  
  const { mutate: uploadImage } = useUploadImage();
  
  const { fields: screenshotFields, append: appendScreenshot, remove: removeScreenshot } = useFieldArray({
    control,
    name: 'screenshots',
  });

  const posterPath = watch('posterPath');
  const bannerPath = watch('bannerPath');

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/original${path}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'poster' | 'banner' | 'screenshot') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading image to Cloudinary...');
    uploadImage({ file, type }, {
      onSuccess: (res) => {
        toast.success('Image uploaded successfully', { id: toastId });
        setValue(fieldName, res.data.url, { shouldValidate: true });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to upload image', { id: toastId });
      }
    });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading screenshot to Cloudinary...');
    uploadImage({ file, type: 'screenshot' }, {
      onSuccess: (res) => {
        toast.success('Screenshot uploaded successfully', { id: toastId });
        appendScreenshot(res.data.url);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to upload screenshot', { id: toastId });
      }
    });
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="step-container step4-media">
      
      <div className="media-grid">
        {/* Poster Section */}
        <div className="media-upload-section">
          <h3 className="section-title">Poster Image *</h3>
          <p className="section-subtitle">Primary movie poster (Vertical)</p>
          
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
              placeholder="Image URL or TMDB Path (/xyz.jpg)"
              {...register('posterPath')} 
              error={errors.posterPath?.message as string} 
              hint="Auto-filled from TMDB if available"
            />
            <label className="upload-btn">
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
              placeholder="Image URL or TMDB Path (/xyz.jpg)"
              {...register('bannerPath')} 
              error={errors.bannerPath?.message as string} 
            />
            <label className="upload-btn">
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bannerPath', 'banner')} hidden />
              <span>📁 Upload</span>
            </label>
          </div>
        </div>
      </div>

      <hr className="step-divider" />

      <div className="screenshots-section">
        <div className="section-header-flex">
          <div>
            <h3 className="section-title">Screenshots / Backdrops</h3>
            <p className="section-subtitle">Add multiple gallery images</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="add-media-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'rgba(124, 58, 237, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>
              <input type="file" accept="image/*" onChange={handleScreenshotUpload} hidden />
              <span>📁 Upload New</span>
            </label>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => appendScreenshot('')}
              className="add-media-btn"
            >
              + Add URL
            </Button>
          </div>
        </div>

        {screenshotFields.length === 0 ? (
          <div className="empty-cast" style={{ marginTop: '16px' }}>
            <p>No screenshots added. Click "+ Add URL" or "Upload New" to build a gallery.</p>
          </div>
        ) : (
          <div className="screenshots-list">
            {screenshotFields.map((field, index) => {
              const val = watch(`screenshots.${index}`);
              return (
                <div key={field.id} className="screenshot-row">
                  {val && (
                    <div className="screenshot-mini-preview">
                      <img src={getImageUrl(val)} alt={`Preview ${index}`} />
                    </div>
                  )}
                  <div className="input-with-upload screenshot-input">
                    <Input 
                      placeholder="Image URL or TMDB Path"
                      {...register(`screenshots.${index}` as const)} 
                    />
                    <label className="upload-btn">
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, `screenshots.${index}`, 'screenshot')} hidden />
                      <span>📁</span>
                    </label>
                  </div>
                  <button 
                    type="button" 
                    className="remove-media-btn"
                    onClick={() => removeScreenshot(index)}
                    title="Remove Screenshot"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr className="step-divider" />

      <div className="trailer-section">
        <h3 className="section-title">Trailer</h3>
        <Input 
          label="YouTube Trailer URL" 
          placeholder="https://www.youtube.com/watch?v=..."
          {...register('trailerUrl')} 
          error={errors.trailerUrl?.message as string} 
          prefix="▶"
        />
      </div>

    </div>
  );
};

export default Step4Media;
