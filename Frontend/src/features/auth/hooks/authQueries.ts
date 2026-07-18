import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../../../services/axios';
import { useAppDispatch } from '../../../store';
import { setUser, clearUser, initializeAuth } from '../../../store';
import type { LoginFormData, RegisterFormData } from '../schemas/authSchemas';
import type { User, ApiResponse } from '../../../types';

// ─── Login ────────────────────────────────────────────────────────────────────
export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginFormData) =>
      apiClient.post<ApiResponse<{ user: User }>>('/v1/auth/login', data),
    onSuccess: ({ data }) => {
      dispatch(setUser(data.data.user));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate('/');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Login failed. Please try again.');
    },
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const useRegisterMutation = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterFormData) =>
      apiClient.post<ApiResponse<{ user: User }>>('/v1/auth/register', data),
    onSuccess: ({ data }) => {
      dispatch(setUser(data.data.user));
      toast.success('Account created! Welcome to CineTrack 🎬');
      navigate('/');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Registration failed.');
    },
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const useLogoutMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiClient.post('/v1/auth/logout'),
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: () => {
      dispatch(clearUser());
      queryClient.clear();
      navigate('/login');
    },
  });
};

// ─── Refresh auth (called on app init) ───────────────────────────────────────
export const useInitializeAuth = () => {
  const dispatch = useAppDispatch();
  return () => dispatch(initializeAuth());
};
