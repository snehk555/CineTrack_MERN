import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoResolution {
  quality: string; // e.g. '1080p', '720p', '480p'
  url: string;     // URL to the specific m3u8 file
}

export interface IVideoAsset extends Document {
  movieId: mongoose.Types.ObjectId;
  type: 'Main' | 'Trailer' | 'BehindTheScenes';
  masterPlaylistUrl?: string; // master.m3u8 containing all resolutions
  resolutions: IVideoResolution[];
  duration?: number;
  thumbnailUrl?: string;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  transcodingJobId?: string; // ID from AWS MediaConvert / FFmpeg queue
}

const videoAssetSchema = new Schema<IVideoAsset>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    type: { type: String, enum: ['Main', 'Trailer', 'BehindTheScenes'], default: 'Main' },
    masterPlaylistUrl: { type: String },
    resolutions: [
      {
        quality: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    duration: { type: Number },
    thumbnailUrl: { type: String },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    transcodingJobId: { type: String },
  },
  { timestamps: true }
);

// Optimize query for finding a specific type of asset for a movie
videoAssetSchema.index({ movieId: 1, type: 1 });

export default mongoose.model<IVideoAsset>('VideoAsset', videoAssetSchema);
