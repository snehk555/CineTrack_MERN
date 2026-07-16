import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, LoginFormData } from '../../../shared/schemas/auth.schema';
import useAuthStore from '../store/useAuthStore';
import { apiClient } from '../../../shared/lib/apiClient';

const LoginPage: React.FC = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // useMutation — TanStack manages loading & error state automatically
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      apiClient.post('/auth/login', { email: data.email, password: data.password }),
    onSuccess: (response) => {
      setUser(response.data.user);
      navigate('/');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex justify-center items-center min-h-[75vh]">
      <div className="bg-[#1e1b2e]/90 p-8 rounded-2xl w-full max-w-md border border-violet-900/30 shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-slate-400 text-center text-sm mb-8 font-medium">Log in to track your cinematic journey</p>

        {loginMutation.isError && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center mb-6 border border-red-500/20 font-medium">
                {(loginMutation.error as any)?.response?.data?.message || "Login failed. Please check your credentials."}
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className={`px-4 py-3 rounded-xl bg-slate-900/50 border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-violet-500'} text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900 transition-all font-medium`}
            />
            {errors.email && <span className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={`px-4 py-3 rounded-xl bg-slate-900/50 border ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-violet-500'} text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900 transition-all font-medium`}
            />
            {errors.password && <span className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-4 bg-violet-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loginMutation.isPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-400 font-medium">
          Don't have an account?
          <Link to="/signup" className="text-violet-400 no-underline font-bold ml-1.5 hover:text-violet-300 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
