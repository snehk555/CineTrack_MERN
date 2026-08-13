import mongoose, { Schema, Document } from 'mongoose';

export interface ISeason extends Document {
  seriesId: mongoose.Types.ObjectId;
  seasonNumber: number;
  title: string;
  overview?: string;
  posterPath?: string;
  tmdbSeasonId?: number;
  episodeCount: number;
  airDate?: Date;
}

const seasonSchema = new Schema<ISeason>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
    seasonNumber: { type: Number, required: true },
    title: { type: String, required: true },
    overview: { type: String },
    posterPath: { type: String },
    tmdbSeasonId: { type: Number },
    episodeCount: { type: Number, default: 0 },
    airDate: { type: Date },
  },
  { timestamps: true }
);

seasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });

const Season = mongoose.model<ISeason>('Season', seasonSchema);
Season.syncIndexes().catch(err => console.error('Failed to sync season indexes:', err));
export default Season;
