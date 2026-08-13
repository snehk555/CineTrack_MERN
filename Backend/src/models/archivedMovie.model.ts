import mongoose, { Schema, Document } from 'mongoose';

export interface IArchivedMovie extends Document {
  originalMovieId: mongoose.Types.ObjectId;
  tmdbId: number;
  title: string;
  slug: string;
  restoreData: Record<string, any>; // JSON string/object of the original movie for restoration
  archivedAt?: Date;
}

const archivedMovieSchema = new Schema<IArchivedMovie>(
  {
    originalMovieId: { type: Schema.Types.ObjectId, required: true },
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    restoreData: { type: Schema.Types.Mixed, required: true }, // Store all old data here
    
    // Auto delete after 30 days using MongoDB TTL Index
    archivedAt: { type: Date, default: Date.now, expires: '30d' },
  },
  { timestamps: true }
);

export default mongoose.model<IArchivedMovie>('ArchivedMovie', archivedMovieSchema);
