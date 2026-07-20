import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSettings extends Document {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  defaultSubscriptionPlan: 'free' | 'basic';
  maxMoviesPerPage: number;
  featuredMovieIds: mongoose.Types.ObjectId[];
  platformName: string;
  supportEmail: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettings>(
  {
    maintenanceMode:         { type: Boolean,  default: false },
    maintenanceMessage:      { type: String,   default: "We're upgrading our servers. Back soon!" },
    allowNewRegistrations:   { type: Boolean,  default: true },
    defaultSubscriptionPlan: { type: String,   enum: ['free', 'basic'], default: 'free' },
    maxMoviesPerPage:        { type: Number,   default: 20, min: 5, max: 100 },
    featuredMovieIds:        [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    platformName:            { type: String,   default: 'CineTrack' },
    supportEmail:            { type: String,   default: 'support@cinetrack.com' },
    updatedBy:               { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ─── Singleton helper — always use this instead of findOne() directly ──────────
appSettingsSchema.statics['getSettings'] = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model<IAppSettings>('AppSettings', appSettingsSchema);
