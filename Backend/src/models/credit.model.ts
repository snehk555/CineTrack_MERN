import mongoose, { Schema, Document } from 'mongoose';

export interface ICredit extends Document {
  movieId: mongoose.Types.ObjectId;
  personId: mongoose.Types.ObjectId;
  roleType: 'Actor' | 'Director' | 'Writer' | 'Producer' | 'Crew';
  characterName?: string; // For actors
  job?: string; // For crew (e.g. Director of Photography)
  order?: number; // Billing order
}

const creditSchema = new Schema<ICredit>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
    roleType: { 
      type: String, 
      enum: ['Actor', 'Director', 'Writer', 'Producer', 'Crew'], 
      required: true 
    },
    characterName: { type: String },
    job: { type: String },
    order: { type: Number },
  },
  { timestamps: true }
);

// A person shouldn't have the exact same role in the same movie twice
creditSchema.index({ movieId: 1, personId: 1, roleType: 1 }, { unique: true });

export default mongoose.model<ICredit>('Credit', creditSchema);
