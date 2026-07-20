import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store';
import { setAdmin } from '@/store';
import apiClient from '@/services/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { loginSchema, twoFASchema } from '@/auth/schemas/authSchemas';
import type { LoginFormData, TwoFAFormData } from '@/auth/schemas/authSchemas';
import type { AdminUser, ApiResponse } from '@/types';
import './LoginPage.css';

// ─── Stats for left panel ─────────────────────────────────────────────────
const STATS = [
  { label: 'Platform uptime', value: '99.97%' },
  { label: 'Active users', value: '1.2K' },
  { label: 'Content processed', value: '340 GB' },
];

type Stage = 'credentials' | '2fa';

// ─── Login Page ───────────────────────────────────────────────────────────
const LoginPage = () => {
  const dispatch = useAppDispatch();
  const [stage, setStage] = useState<Stage>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Credentials form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // ── 2FA form
  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
    setValue: setValue2FA,
    watch: watch2FA,
  } = useForm<TwoFAFormData>({ resolver: zodResolver(twoFASchema) });

  // ── Credentials mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      apiClient.post<ApiResponse<{ user: AdminUser; requiresTwoFA?: boolean }>>(
        '/v1/admin/auth/login',
        data
      ),
    onSuccess: ({ data }) => {
      if (data.data.requiresTwoFA) {
        setStage('2fa');
        toast.info('Enter your authenticator code');
      } else {
        dispatch(setAdmin(data.data.user));
        toast.success(`Welcome back, ${data.data.user.name}`);
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Invalid credentials');
    },
  });

  // ── 2FA mutation
  const twoFAMutation = useMutation({
    mutationFn: (data: TwoFAFormData) =>
      apiClient.post<ApiResponse<{ user: AdminUser }>>('/v1/admin/auth/2fa/verify', data),
    onSuccess: ({ data }) => {
      dispatch(setAdmin(data.data.user));
      toast.success(`Welcome back, ${data.data.user.name}`);
    },
    onError: () => {
      toast.error('Invalid or expired code. Try again.');
    },
  });

  // ── OTP box keyboard handler
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (e.key === 'Backspace' && !input.value && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    e.target.value = val;
    const code = watch2FA('code') ?? '      ';
    const arr = code.split('');
    arr[index] = val || ' ';
    setValue2FA('code', arr.join('').replace(/ /g, ''));
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="login-page">
      {/* ── Left Panel ── */}
      <aside className="login-left">
        <div className="login-left__brand">
          <span className="login-brand-icon">◆</span>
          <span className="login-brand-name">CineTrack</span>
          <span className="login-brand-tag">Admin</span>
        </div>

        <div className="login-left__content">
          <h1 className="login-left__headline">
            Platform control,
            <br />
            <span className="login-left__headline--accent">fully in your hands.</span>
          </h1>
          <p className="login-left__sub">
            Internal admin console. Restricted access only.
            All actions are logged and audited.
          </p>
        </div>

        <div className="login-left__stats">
          {STATS.map((s) => (
            <div key={s.label} className="login-stat">
              <span className="login-stat__value">{s.value}</span>
              <span className="login-stat__label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="login-left__footer">
          <span className="login-left__security">
            🔒 AES-256 encrypted · TLS 1.3 · 2FA enforced
          </span>
        </div>
      </aside>

      {/* ── Right Panel ── */}
      <main className="login-right">
        <div className="login-form-container">

          {stage === 'credentials' ? (
            <>
              <div className="login-form__header">
                <h2 className="login-form__title">Sign in to Admin Portal</h2>
                <p className="login-form__sub">
                  Use your admin credentials to continue
                </p>
              </div>

              <form
                className="login-form"
                onSubmit={handleSubmit((d) => loginMutation.mutate(d))}
                noValidate
              >
                <Input
                  label="Email address"
                  type="email"
                  placeholder="admin@cinetrack.com"
                  autoComplete="email"
                  autoFocus
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="login-form__password-group">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    suffix={
                      <button
                        type="button"
                        className="login-form__eye"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁' : '👁‍🗨'}
                      </button>
                    }
                    {...register('password')}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loginMutation.isPending}
                >
                  Continue
                </Button>
              </form>

              <p className="login-form__notice">
                This portal is restricted to authorized personnel only.
                Unauthorized access attempts are logged.
              </p>
            </>
          ) : (
            <>
              {/* ── 2FA Stage ── */}
              <div className="login-form__header">
                <div className="login-2fa__icon">🔐</div>
                <h2 className="login-form__title">Two-factor authentication</h2>
                <p className="login-form__sub">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <form
                className="login-form"
                onSubmit={handleSubmit2FA((d) => twoFAMutation.mutate(d))}
                noValidate
              >
                <div className="login-otp-group">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="login-otp-box"
                      ref={(el) => { otpRefs.current[i] = el; }}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onChange={(e) => handleOtpInput(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {/* Hidden input for zod validation */}
                <input type="hidden" {...register2FA('code')} />
                {errors2FA.code && (
                  <p className="login-otp-error">{errors2FA.code.message}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={twoFAMutation.isPending}
                >
                  Verify & Sign in
                </Button>

                <button
                  type="button"
                  className="login-form__back"
                  onClick={() => setStage('credentials')}
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
