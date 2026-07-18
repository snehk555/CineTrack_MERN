import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  orderId?: string;
  amount: number;
  currency: string;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['pro', 'premium'], required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'trial' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentId: { type: String },
    orderId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
