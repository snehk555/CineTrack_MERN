import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  enabledFor: mongoose.Types.ObjectId[]; // if non-empty, only these userIds see the feature (gradual rollout)
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, maxlength: 500 },
    enabled:      { type: Boolean, default: false },
    enabledFor:   [{ type: Schema.Types.ObjectId, ref: 'User' }], // empty = global toggle
    updatedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
    updatedByName:{ type: String },
  },
  { timestamps: true }
);




export default mongoose.model<IFeatureFlag>('FeatureFlag', featureFlagSchema);
