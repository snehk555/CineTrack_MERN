import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'premium' | 'moderator' | 'admin';
  googleId?: string;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  banUntil?: Date;
  lastLoginAt?: Date;
  subscriptionPlan: 'free' | 'pro' | 'premium';
  subscriptionExpiresAt?: Date;
  isLocked: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'premium', 'moderator', 'admin'], default: 'user' },
    googleId: { type: String, sparse: true },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    banUntil: { type: Date },
    lastLoginAt: { type: Date },
    subscriptionPlan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
    subscriptionExpiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.banUntil && this.banUntil > new Date());
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', userSchema);