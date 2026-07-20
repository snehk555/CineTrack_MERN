import mongoose, { Schema, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  slug: string;
  color: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const genreSchema = new Schema<IGenre>(
  {
    name:      { type: String, required: true, unique: true, trim: true },
    slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    color:     { type: String, default: '#6366f1' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);



export default mongoose.model<IGenre>('Genre', genreSchema);