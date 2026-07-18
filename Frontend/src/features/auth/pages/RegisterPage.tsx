import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../schemas/authSchemas';
import { useRegisterMutation } from '../hooks/authQueries';
import Input from '../../../shared/components/ui/Input';
import PasswordInput from '../../../shared/components/ui/PasswordInput';
import Button from '../../../shared/components/ui/Button';

const getStrength = (password: string): { level: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { level: 0, label: '', color: '' },
    { level: 1, label: 'Weak', color: 'bg-red-500' },
    { level: 2, label: 'Fair', color: 'bg-amber-500' },
    { level: 3, label: 'Good', color: 'bg-blue-500' },
    { level: 4, label: 'Strong', color: 'bg-emerald-500' },
  ];
  return levels[score];
};

export default function RegisterPage() {
  const { mutate: registerUser, isPending } = useRegisterMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const password = watch('password', '');
  const strength = getStrength(password);

  const onSubmit = (data: RegisterFormData) => registerUser(data);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090f] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            🎬 <span className="text-violet-400">CineTrack</span>
          </h1>
          <p className="text-slate-400 text-sm">Join your movie universe</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input label="Full Name" placeholder="John Doe" required error={errors.name?.message} {...register('name')} />
            <Input label="Username" placeholder="johndoe_99" required error={errors.username?.message} {...register('username')} />
            <Input label="Email" type="email" placeholder="you@example.com" required error={errors.email?.message} {...register('email')} />

            <div className="flex flex-col gap-1.5">
              <PasswordInput label="Password" placeholder="Min 8 chars" required error={errors.password?.message} {...register('password')} />
              {password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <PasswordInput label="Confirm Password" placeholder="Repeat password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" isLoading={isPending} fullWidth className="mt-2">
              {isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
