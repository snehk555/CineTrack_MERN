import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../schemas/authSchemas';
import { useLoginMutation } from '../hooks/authQueries';
import Input from '../../../shared/components/ui/Input';
import PasswordInput from '../../../shared/components/ui/PasswordInput';
import Button from '../../../shared/components/ui/Button';

export default function LoginPage() {
  const { mutate: login, isPending } = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormData) => login(data);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090f] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            🎬 <span className="text-violet-400">CineTrack</span>
          </h1>
          <p className="text-slate-400 text-sm">Your personal movie universe</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isLoading={isPending} fullWidth className="mt-2">
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
