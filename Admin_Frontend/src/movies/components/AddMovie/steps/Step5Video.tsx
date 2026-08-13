import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import Button from '@/components/ui/Button';
import apiClient from '@/services/axios';
import { toast } from 'sonner';
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

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }

    setUploadStatus('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/v1/admin/upload-video', formData, {
        timeout: 0,
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }, // Override default application/json so multer can parse the video file
        onUploadProgress: (progressEvent) => {  
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      if (response.data.success) {
        setUploadStatus('ready');
        // Setting the local file path returned by the server as videoUrl
        setValue('videoUrl', response.data.data.url, { shouldValidate: true });
        toast.success('Video uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('idle');
      toast.error('Failed to upload video');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
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
