import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../schemas/authSchemas';
import apiClient from '../../../services/axios';
import Input from '../../../shared/components/ui/Input';
import Button from '../../../shared/components/ui/Button';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiClient.post('/v1/auth/forgot-password', data);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            🎬 <span className="text-amber-400">CineTrack</span>
          </h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-6">
                We've sent password reset instructions to your email address.
              </p>
              <Link to="/login" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Forgot password?</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we'll send you reset instructions.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" isLoading={isSubmitting} fullWidth>
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
