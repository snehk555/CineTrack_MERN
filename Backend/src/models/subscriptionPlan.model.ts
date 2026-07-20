import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  key: 'free' | 'premium' | 'pro';
  name: string;
  priceMonthly: number;  // in paise (₹1 = 100 paise) — for Razorpay
  priceYearly: number;
  features: string[];
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    key:          { type: String, enum: ['free', 'premium', 'pro'], required: true, unique: true },
    name:         { type: String, required: true },
    priceMonthly: { type: Number, default: 0, min: 0 },  // 0 = free
    priceYearly:  { type: Number, default: 0, min: 0 },
    features:     [{ type: String }],
    isActive:     { type: Boolean, default: true },
    updatedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
    updatedByName:{ type: String },
  },
  { timestamps: true }
);




export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
