import mongoose, { Schema, Document } from 'mongoose';

interface CastMember {
  name: string;
  character: string;
  profilePath?: string;
}

export interface ISeries extends Document {
  tmdbId: number;
  title: string;
  slug: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  screenshots?: string[];
  trailerUrl?: string;
  releaseYear?: number;
  spokenLanguage?: string;
  country?: string;
  contentRating?: 'U' | 'U/A' | 'A';
  categoryId?: mongoose.Types.ObjectId;
  genreIds: mongoose.Types.ObjectId[];
  cast: CastMember[];
  directors: string[];
  averageRating: number;
  totalRatings: number;
  totalWatchlists: number;
  status: 'published' | 'draft' | 'archived' | 'scheduled';
  publishAt?: Date;
  isFeatured: boolean;
  featuredUntil?: Date;
  isDeleted: boolean;
  
  // Series Specific
  totalSeasons?: number;
  totalEpisodes?: number;
}

const castMemberSchema = new Schema<CastMember>(
  {
    name: { type: String, required: true },
    character: { type: String, required: true },
    profilePath: { type: String },
  },
  { _id: false }
);

const seriesSchema = new Schema<ISeries>(
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
    spokenLanguage: { type: String },
    country: { type: String },
    contentRating: { type: String, enum: ['U', 'U/A', 'A'], default: 'U/A' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    genreIds: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
    cast: [castMemberSchema],
    directors: [{ type: String }],
    averageRating: { type: Number, default: 0, min: 0, max: 10 },
    totalRatings: { type: Number, default: 0 },
    totalWatchlists: { type: Number, default: 0 },
    status: { type: String, enum: ['published', 'draft', 'archived', 'scheduled'], default: 'draft' },
    publishAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    isDeleted: { type: Boolean, default: false, select: false },

    // Series Specific
    totalSeasons: { type: Number, default: 0 },
    totalEpisodes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

seriesSchema.index({ tmdbId: 1 }, { unique: true });
seriesSchema.index({ slug: 1 }, { unique: true });
seriesSchema.index({ categoryId: 1, genreIds: 1 });
seriesSchema.index({ status: 1, isFeatured: 1 });
seriesSchema.index({ title: 'text', overview: 'text' });

const Series = mongoose.model<ISeries>('Series', seriesSchema);
Series.syncIndexes().catch(err => console.error('Failed to sync series indexes:', err));
export default Series;
