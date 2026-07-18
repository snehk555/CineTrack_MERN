import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  isApproved: boolean;
  likes: number;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    comment: { type: String, maxlength: 1000 },
    isApproved: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });
reviewSchema.index({ movieId: 1, isApproved: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);
