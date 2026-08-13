import mongoose, { Schema, Document } from 'mongoose';

interface CastMember {
  name: string;
  character: string;
  profilePath?: string;
}

export interface IEpisode extends Document {
  seriesId: mongoose.Types.ObjectId;
  seasonId: mongoose.Types.ObjectId;
  episodeNumber: number;
  title: string;
  overview?: string;
  runtime?: number;
  thumbnailUrl?: string;
  airDate?: Date;
  cast: CastMember[];
  screenshots?: string[];
  trailerUrl?: string;
  videoUrls: Map<string, string>;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  status: 'published' | 'draft' | 'archived' | 'scheduled';
  publishAt?: Date;
}

const castMemberSchema = new Schema<CastMember>(
  {
    name: { type: String, required: true },
    character: { type: String, required: true },
    profilePath: { type: String },
  },
  { _id: false }
);

const episodeSchema = new Schema<IEpisode>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
    seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    overview: { type: String },
    runtime: { type: Number },
    thumbnailUrl: { type: String },
    airDate: { type: Date },
    cast: [castMemberSchema],
    screenshots: [{ type: String }],
    trailerUrl: { type: String },
    videoUrls: { type: Map, of: String, default: {} },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    status: { type: String, enum: ['published', 'draft', 'archived', 'scheduled'], default: 'draft' },
    publishAt: { type: Date },
  },
  { timestamps: true }
);

episodeSchema.index({ seriesId: 1, seasonId: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ seriesId: 1 });
episodeSchema.index({ status: 1 });

const Episode = mongoose.model<IEpisode>('Episode', episodeSchema);
Episode.syncIndexes().catch(err => console.error('Failed to sync episode indexes:', err));
export default Episode;
