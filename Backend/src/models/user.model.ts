import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'premium' | 'moderator' | 'admin' | 'super_admin';
  googleId?: string;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  banUntil?: Date;
  suspendedUntil?: Date;
  suspensionReason?: string;
  lastLoginAt?: Date;
  subscriptionPlan: 'free' | 'pro' | 'premium';
  subscriptionExpiresAt?: Date;
  isLocked: boolean;
  isTwoFAEnabled: boolean;
  twoFASecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    username: { type: String, trim: true, lowercase: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: function(this: any) { return !this.googleId; }, select: false },
    role: { type: String, enum: ['user', 'premium', 'moderator', 'admin', 'super_admin'], default: 'user' },
    googleId: { type: String },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason:        { type: String },
    banUntil:         { type: Date },
    suspendedUntil:   { type: Date },
    suspensionReason: { type: String },
    lastLoginAt:      { type: Date },
    subscriptionPlan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
    subscriptionExpiresAt: { type: Date },
    isTwoFAEnabled: { type: Boolean, default: false },
    twoFASecret: { type: String, select: false },
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