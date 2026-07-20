import mongoose, { Schema, Document } from 'mongoose';

interface CastMember {
  name: string;
  character: string;
  profilePath?: string;
}

export interface IMovie extends Document {
  tmdbId: number;
  title: string;
  slug: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  screenshots?: string[];
  trailerUrl?: string;
  releaseYear?: number;
  runtime?: number;
  language?: string;
  country?: string;
  categoryId: mongoose.Types.ObjectId;
  genreIds: mongoose.Types.ObjectId[];
  cast: CastMember[];
  directors: string[];
  averageRating: number;
  totalRatings: number;
  totalWatchlists: number;
  status: 'published' | 'draft' | 'archived';
  isFeatured: boolean;
  featuredUntil?: Date;
  isDeleted: boolean;
  videoUrls: Map<string, string>;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  videoDuration?: number;
  thumbnailUrl?: string;
}

const castMemberSchema = new Schema<CastMember>(
  {
    name: { type: String, required: true },
    character: { type: String, required: true },
    profilePath: { type: String },
  },
  { _id: false }
);

const movieSchema = new Schema<IMovie>(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    overview: { type: String },
    posterPath: { type: String },
    backdropPath: { type: String },
    screenshots: [{ type: String }],
    trailerUrl: { type: String },
    releaseYear: { type: Number, min: 1900 },
    runtime: { type: Number, min: 1 },
    language: { type: String },
    country: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    genreIds: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
    cast: [castMemberSchema],
    directors: [{ type: String }],
    averageRating: { type: Number, default: 0, min: 0, max: 10 },
    totalRatings: { type: Number, default: 0 },
    totalWatchlists: { type: Number, default: 0 },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    isDeleted: { type: Boolean, default: false, select: false },
    videoUrls: { type: Map, of: String, default: {} },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    videoDuration: { type: Number },
    thumbnailUrl: { type: String },
  },
  { timestamps: true }
);

movieSchema.index({ tmdbId: 1 }, { unique: true });
movieSchema.index({ slug: 1 }, { unique: true });
movieSchema.index({ categoryId: 1, genreIds: 1 });
movieSchema.index({ status: 1, isFeatured: 1 });
movieSchema.index({ averageRating: -1 });
movieSchema.index({ title: 'text', overview: 'text' });

export default mongoose.model<IMovie>('Movie', movieSchema);