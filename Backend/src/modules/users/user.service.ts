import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import { NotFoundError, AppError } from '../../utils/AppError.js';
import type { UpdateProfileInput } from './user.schema.js';

export const userService = {

  // ─── Get own profile ────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await User.findById(userId)
      .select('-password -twoFASecret')
      .lean();
    if (!user) throw new NotFoundError('User');
    return user;
  },

  // ─── Update name / username / bio ───────────────────────────────────────────
  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Username uniqueness check (if changing)
    if (data.username) {
      const taken = await User.findOne({ username: data.username, _id: { $ne: userId } }).lean();
      if (taken) throw new AppError('Username is already taken', 409, 'USERNAME_TAKEN');
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    ).select('-password -twoFASecret').lean();

    if (!updated) throw new NotFoundError('User');
    return updated;
  },

  // ─── Change password ─────────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new NotFoundError('User');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
  },
};
