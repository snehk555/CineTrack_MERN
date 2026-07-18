import mongoose, { Schema, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
}

const genreSchema = new Schema<IGenre>({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
});

genreSchema.index({ name: 1 }, { unique: true });

export default mongoose.model<IGenre>('Genre', genreSchema);