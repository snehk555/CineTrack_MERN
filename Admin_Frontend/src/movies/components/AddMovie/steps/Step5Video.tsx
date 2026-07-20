import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import Button from '@/components/ui/Button';
import './Step5Video.css';

const Step5Video = () => {
  const { setValue, watch } = useFormContext();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoUrl = watch('videoUrl');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const simulateUpload = () => {
    setUploadStatus('uploading');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadStatus('processing');
          setTimeout(() => {
            setUploadStatus('ready');
            setValue('videoUrl', 'internal://uploaded_video_placeholder.mp4', { shouldValidate: true });
          }, 1500);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload();
    }
  };

  return (
    <div className="step-container step5-video">
      
      <div className="video-upload-header">
        <h3 className="section-title">Master Video Upload</h3>
        <p className="section-subtitle">
          Upload the master video file. It will be sent to the <strong>BullMQ Media Pipeline</strong> for HLS transcoding.
        </p>
      </div>

      <div 
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${uploadStatus !== 'idle' ? 'uploading-state' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => uploadStatus === 'idle' && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="video/*"
          onChange={handleFileChange}
        />

        {uploadStatus === 'idle' && (
          <div className="dropzone-content">
            <span className="upload-icon">🎞️</span>
            <h4>Drag & Drop your video file here</h4>
            <p>MP4, MKV, AVI up to 10GB</p>
            <Button variant="ghost" className="browse-btn">Browse Files</Button>
          </div>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="upload-progress-container">
            <span className="upload-icon pulse">
              {uploadStatus === 'uploading' ? '⬆️' : '⚙️'}
            </span>
            <h4>{uploadStatus === 'uploading' ? 'Uploading to Server...' : 'Processing in Queue...'}</h4>
            <div className="video-progress-bar">
              <div className="video-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {uploadStatus === 'ready' && videoUrl && (
          <div className="upload-success">
            <span className="upload-icon success">✅</span>
            <h4>Video Ready for Processing</h4>
            <p>The file is queued in BullMQ. Transcoding will start automatically.</p>
            <Button variant="ghost" onClick={(e) => {
              e.stopPropagation();
              setUploadStatus('idle');
              setValue('videoUrl', '');
            }}>
              Replace Video
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Step5Video;
