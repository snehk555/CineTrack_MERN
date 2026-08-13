import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useSaveDetailedEpisode } from '../../hooks/seriesQueries';
import { useUploadImage } from '@/movies/hooks/moviesQueries';
import apiClient from '@/services/axios';
import './AddEpisodeModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  seriesId: string;
  tmdbEpisodeData: any; // Data fetched from TMDB
}

const STEPS = ['Basic Info', 'Cast & Crew', 'Media & Video', 'Review & Submit'];

const AddEpisodeModal: React.FC<Props> = ({ isOpen, onClose, seriesId, tmdbEpisodeData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'ready'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { mutate: saveEpisode, isPending } = useSaveDetailedEpisode();
  const { mutate: uploadImage } = useUploadImage();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      seasonNumber: 1,
      episodeNumber: 1,
      title: '',
      overview: '',
      runtime: 0,
      airDate: '',
      thumbnailUrl: '',
      cast: [] as { name: string; character: string; profilePath: string }[],
      screenshots: [] as { url: string }[],
      trailerUrl: '',
      rawVideoPath: '',
      status: 'draft',
      publishAt: '',
    }
  });

  const { fields: castFields, append: appendCast, remove: removeCast } = useFieldArray({ control, name: 'cast' });
  const { fields: screenshotFields, append: appendScreenshot, remove: removeScreenshot } = useFieldArray({ control, name: 'screenshots' });
  
  const status = watch('status');

  // Pre-fill form when TMDB data changes
  useEffect(() => {
    if (tmdbEpisodeData) {
      reset({
        seasonNumber: tmdbEpisodeData.season_number || tmdbEpisodeData.tmdbSeasonData?.season_number || 1,
        episodeNumber: tmdbEpisodeData.episode_number || 1,
        title: tmdbEpisodeData.name || '',
        overview: tmdbEpisodeData.overview || '',
        runtime: tmdbEpisodeData.runtime || 0,
        airDate: tmdbEpisodeData.air_date || '',
        thumbnailUrl: tmdbEpisodeData.still_path ? `https://image.tmdb.org/t/p/original${tmdbEpisodeData.still_path}` : '',
        cast: tmdbEpisodeData.guest_stars ? tmdbEpisodeData.guest_stars.map((c: any) => ({
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : ''
        })) : [],
        screenshots: [],
        trailerUrl: tmdbEpisodeData.trailerUrl || '',
        rawVideoPath: '',
        status: 'draft',
        publishAt: '',
      });
      setCurrentStep(1);
    }
  }, [tmdbEpisodeData, reset]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading thumbnail...');
    uploadImage({ file, type: 'screenshot' }, {
      onSuccess: (res: any) => {
        toast.success('Thumbnail uploaded', { id: toastId });
        setValue('thumbnailUrl', res.data.url, { shouldValidate: true });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Upload failed', { id: toastId });
      }
    });
    e.target.value = '';
  };

  const handleTmdbThumbRefetch = () => {
    if (!tmdbEpisodeData) return;
    const stillPath = tmdbEpisodeData.still_path;
    if (stillPath) {
      setValue('thumbnailUrl', `https://image.tmdb.org/t/p/original${stillPath}`, { shouldValidate: true });
      toast.success('Thumbnail re-fetched from TMDB!');
    } else {
      toast.error('No thumbnail available on TMDB for this episode.');
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading screenshot...');
    uploadImage({ file, type: 'screenshot' }, {
      onSuccess: (res: any) => {
        toast.success('Screenshot uploaded', { id: toastId });
        if (index >= 0) {
          setValue(`screenshots.${index}.url`, res.data.url, { shouldValidate: true });
        } else {
          appendScreenshot({ url: res.data.url });
        }
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Upload failed', { id: toastId });
      }
    });
    e.target.value = '';
  };

  const uploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/v1/admin/upload-video', formData, {
        timeout: 0,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.data.success) {
        setUploadStatus('ready');
        setValue('rawVideoPath', response.data.data.url, { shouldValidate: true });
        toast.success('Video uploaded successfully! It will be processed when you save the episode.');
      }
    } catch (error: any) {
      console.error('Upload failed:', error?.response?.data || error);
      setUploadStatus('idle');
      toast.error(error?.response?.data?.message || 'Failed to upload video');
    }
    e.target.value = '';
  };

  if (!isOpen || !tmdbEpisodeData) return null;

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, STEPS.length));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  const onSubmit = (data: any) => {
    const payload = {
      seasonNumber: data.seasonNumber,
      episodeNumber: data.episodeNumber,
      title: data.title,
      overview: data.overview,
      runtime: data.runtime,
      airDate: data.airDate,
      thumbnailUrl: data.thumbnailUrl,
      cast: data.cast,
      screenshots: data.screenshots.map((s: any) => s.url).filter(Boolean),
      trailerUrl: data.trailerUrl,
      rawVideoPath: data.rawVideoPath,
      tmdbSeasonData: tmdbEpisodeData.tmdbSeasonData,
    };

    saveEpisode(
      { seriesId, data: payload },
      {
        onSuccess: () => {
          toast.success(`Episode ${data.episodeNumber} saved successfully!`);
          onClose();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to save episode');
        }
      }
    );
  };

  const formValues = watch();

  return (
    <div className="aem-overlay">
      <div className="aem-modal">
        <div className="aem-header">
          <div>
            <h2>Add Episode {formValues.episodeNumber}</h2>
            <p>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</p>
          </div>
          <button className="aem-close" onClick={onClose}>&times;</button>
        </div>

        <div className="aem-progress">
          <div className="aem-progress-fill" style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
        </div>

        <div className="aem-body">
          {currentStep === 1 && (
            <div className="aem-step-content">
              <h3>Basic Info</h3>
              <div className="aem-grid-2">
                <Input label="Title" {...register('title')} />
                <Input label="Air Date" type="date" {...register('airDate')} />
                <Input label="Runtime (mins)" type="number" {...register('runtime')} />
              </div>

              {/* Thumbnail Section */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Thumbnail</label>
                {watch('thumbnailUrl') && (
                  <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={watch('thumbnailUrl')} alt="Thumbnail" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '140px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1 }}>
                    <Input placeholder="Paste thumbnail URL..." {...register('thumbnailUrl')} />
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} title="Upload from computer">
                    <input type="file" accept="image/*" onChange={handleThumbnailUpload} hidden />
                    📁 Upload
                  </label>
                  {tmdbEpisodeData?.still_path && (
                    <button
                      type="button"
                      onClick={handleTmdbThumbRefetch}
                      style={{ padding: '0 12px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ↻ TMDB
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Overview</label>
                <textarea className="aem-textarea" {...register('overview')} rows={4} />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="aem-step-content">
              <h3>Cast & Crew</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '1rem' }}>Add guest stars or episode specific cast.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {castFields.map((field, index) => {
                  const profilePath = watch(`cast.${index}.profilePath`);
                  const imgUrl = profilePath ? 
                    (profilePath.startsWith('http') ? profilePath : `https://image.tmdb.org/t/p/w200${profilePath}`) 
                    : null;
                  
                  return (
                    <div key={field.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative' }}>
                      <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '12px' }}>
                        {imgUrl ? <img src={imgUrl} alt="Actor" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} /> : 'No Img'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                        <Input placeholder="Actor Name" {...register(`cast.${index}.name`)} />
                        <Input placeholder="Character" {...register(`cast.${index}.character`)} />
                        <input type="hidden" {...register(`cast.${index}.profilePath`)} />
                      </div>
                      <button type="button" onClick={() => removeCast(index)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#111', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>&times;</button>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" onClick={() => appendCast({ name: '', character: '', profilePath: '' })} style={{ marginTop: '1rem' }}>
                + Add Cast Member
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="aem-step-content">
              <h3>Media & Video</h3>
              <Input label="Trailer URL" {...register('trailerUrl')} />
              
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Screenshots</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <label className="aem-upload-btn" style={{ cursor: 'pointer', background: 'rgba(124, 58, 237, 0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#a78bfa' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleScreenshotUpload(e, -1)} hidden />
                  <span>📁 Upload New</span>
                </label>
                <Button type="button" variant="ghost" onClick={() => appendScreenshot({ url: '' })}>+ Add URL</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {screenshotFields.map((field, index) => {
                  const url = watch(`screenshots.${index}.url`);
                  const imgUrl = url ? (url.startsWith('http') ? url : `https://image.tmdb.org/t/p/original${url}`) : null;
                  
                  return (
                    <div key={field.id} className="aem-cast-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {imgUrl ? (
                        <div style={{ width: '80px', height: '45px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={imgUrl} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '80px', height: '45px', borderRadius: '4px', backgroundColor: '#334155', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>
                          No Img
                        </div>
                      )}
                      
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Input placeholder="Screenshot URL" {...register(`screenshots.${index}.url`)} />
                        <label style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '16px', background: 'transparent', padding: '4px' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleScreenshotUpload(e, index)} hidden />
                          📁
                        </label>
                      </div>
                      <Button variant="ghost" onClick={() => removeScreenshot(index)}>X</Button>
                    </div>
                  );
                })}
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Episode Video</h4>
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #334155', textAlign: 'center' }}>
                {uploadStatus === 'idle' && (
                  <>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '14px' }}>Upload the master video file (.mp4, .mkv). It will be added to the queue for processing.</p>
                    <label style={{ cursor: 'pointer', background: '#7c3aed', padding: '8px 16px', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: 500, display: 'inline-block' }}>
                      <input type="file" accept="video/*" onChange={uploadVideoFile} hidden />
                      <span>🎞️ Browse Video</span>
                    </label>
                  </>
                )}
                {uploadStatus === 'uploading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ color: '#e2e8f0', marginBottom: '8px', fontWeight: 500 }}>Uploading Video... {uploadProgress}%</p>
                    <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#7c3aed', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                )}
                {uploadStatus === 'ready' && (
                  <div style={{ color: '#10b981' }}>
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>✅</span>
                    <p style={{ fontWeight: 500, marginBottom: '4px' }}>Video File Uploaded Successfully!</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>It will be encoded to HLS format in the background once you save the episode.</p>
                    <Button variant="ghost" onClick={() => setUploadStatus('idle')} style={{ marginTop: '12px' }}>Replace Video</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="aem-step-content">
              <div className="aem-step6-review">
                
                <div className="aem-summary-section">
                  <h3 className="section-title">Review Episode Details</h3>
                  
                  <div className="aem-summary-card">
                    <div className="aem-summary-poster">
                      {formValues.thumbnailUrl ? (
                        <img src={formValues.thumbnailUrl} alt="Thumbnail" />
                      ) : (
                        <div className="aem-no-poster">No Poster</div>
                      )}
                    </div>
                    
                    <div className="aem-summary-details">
                      <h4 className="aem-summary-title">{formValues.title || 'Untitled Episode'}</h4>
                      <div className="aem-summary-meta">
                        <span>Season {formValues.seasonNumber} • Episode {formValues.episodeNumber}</span> • 
                        <span>{formValues.runtime || 0} mins</span>
                      </div>
                      <p className="aem-summary-desc">{formValues.overview || 'No overview provided.'}</p>
                      
                      <div className="aem-summary-stats">
                        <div className="aem-stat">
                          <span className="aem-stat-label">Cast Members</span>
                          <span className="aem-stat-value">{formValues.cast?.length || 0}</span>
                        </div>
                        <div className="aem-stat">
                          <span className="aem-stat-label">Screenshots</span>
                          <span className="aem-stat-value">{formValues.screenshots?.length || 0}</span>
                        </div>
                        <div className="aem-stat">
                          <span className="aem-stat-label">Video</span>
                          <span className="aem-stat-value">{formValues.rawVideoPath ? '✅ Uploaded' : '❌ Pending'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                <div className="aem-publishing-section">
                  <h3 className="section-title">Publishing Strategy</h3>
                  
                  <div className="aem-status-options">
                    <label className={`aem-status-option ${status === 'draft' ? 'selected' : ''}`}>
                      <input type="radio" value="draft" {...register('status')} />
                      <div className="aem-option-content">
                        <h4>Save as Draft</h4>
                        <p>Keep it hidden until you manually publish it later.</p>
                      </div>
                    </label>

                    <label className={`aem-status-option ${status === 'published' ? 'selected' : ''}`}>
                      <input type="radio" value="published" {...register('status')} />
                      <div className="aem-option-content">
                        <h4>Publish Now</h4>
                        <p>Make it immediately available to all users.</p>
                      </div>
                    </label>

                    <label className={`aem-status-option ${status === 'scheduled' ? 'selected' : ''}`}>
                      <input type="radio" value="scheduled" {...register('status')} />
                      <div className="aem-option-content">
                        <h4>Schedule for Later</h4>
                        <p>Automatically publish at a specific date and time.</p>
                      </div>
                    </label>
                  </div>

                  {status === 'scheduled' && (
                    <div className="aem-schedule-date-picker">
                      <Input 
                        type="datetime-local" 
                        label="Select Publish Date & Time *"
                        {...register('publishAt', { valueAsDate: true })}
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        <div className="aem-footer">
          <Button variant="ghost" onClick={currentStep === 1 ? onClose : prevStep}>
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep}>Next Step →</Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)} loading={isPending}>Save Episode</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEpisodeModal;
