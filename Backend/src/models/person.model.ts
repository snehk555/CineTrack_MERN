import mongoose, { Schema, Document } from 'mongoose';

export interface IPerson extends Document {
  tmdbId: number;
  name: string;
  biography?: string;
  profilePath?: string;
}

const personSchema = new Schema<IPerson>(
  {
    tmdbId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true, index: true },
    biography: { type: String },
    profilePath: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPerson>('Person', personSchema);
