import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch, setUser } from '../store';
import { editProfileSchema, changePasswordSchema, EditProfileFormData, ChangePasswordFormData } from '../features/auth/schemas/authSchemas';
import apiClient from '../services/axios';
import Input from '../shared/components/ui/Input';
import PasswordInput from '../shared/components/ui/PasswordInput';
import Button from '../shared/components/ui/Button';
import type { User } from '../types';

const planBadge: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-500/30 text-slate-300 border-slate-500/30' },
  pro: { label: 'Pro', color: 'bg-blue-500/30 text-blue-300 border-blue-500/30' },
  premium: { label: 'Premium', color: 'bg-amber-500/30 text-amber-300 border-amber-500/30' },
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile');

  const profileForm = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: user?.name ?? '', username: user?.username ?? '', bio: '' },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: EditProfileFormData) => {
    try {
      const { data: res } = await apiClient.patch<{ success: boolean; data: { user: User } }>('/v1/auth/profile', data);
      dispatch(setUser(res.data.user));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      await apiClient.patch('/v1/auth/change-password', data);
      passwordForm.reset();
      toast.success('Password changed!');
    } catch {
      toast.error('Current password is incorrect');
    }
  };

  const plan = user?.subscriptionPlan ?? 'free';
  const badge = planBadge[plan];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-5 mb-8 p-6 bg-white/5 border border-white/8 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-zinc-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-amber-500/30">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-slate-400 text-sm">@{user?.username}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-3 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label} Plan
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 border border-white/8 rounded-xl p-1">
          {(user?.googleId ? ['profile', 'subscription'] : ['profile', 'password', 'subscription']).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'profile' | 'password' | 'subscription')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
                activeTab === tab ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Edit Profile</h2>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
              <Input label="Full Name" required error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
              <Input label="Username" required error={profileForm.formState.errors.username?.message} {...profileForm.register('username')} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm outline-none focus:border-amber-500 transition-colors resize-none"
                  {...profileForm.register('bio')}
                />
                {profileForm.formState.errors.bio && (
                  <p className="text-xs text-red-400">⚠ {profileForm.formState.errors.bio.message}</p>
                )}
              </div>
              <Button type="submit" isLoading={profileForm.formState.isSubmitting}>Save Changes</Button>
            </form>
          </div>
        )}

        {/* Tab: Password */}
        {activeTab === 'password' && !user?.googleId && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Change Password</h2>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
              <PasswordInput label="Current Password" required error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
              <PasswordInput label="New Password" required error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
              <PasswordInput label="Confirm New Password" required error={passwordForm.formState.errors.confirmNewPassword?.message} {...passwordForm.register('confirmNewPassword')} />
              <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>Change Password</Button>
            </form>
          </div>
        )}

        {/* Tab: Subscription */}
        {activeTab === 'subscription' && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">👑</div>
            <h2 className="text-xl font-bold text-white mb-1">Current Plan: {badge.label}</h2>
            <p className="text-slate-400 text-sm mb-6">Upgrade to unlock all features</p>
            {plan === 'free' && (
              <Button onClick={() => window.location.href = '/subscription'} variant="primary">
                Upgrade Plan
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
