import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/axios';
import type { ApiResponse, User } from '../../../types';

// ─── Key Factory ──────────────────────────────────────────────────────────────
export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  movies: (filters: object) => ['admin', 'movies', filters] as const,
  users: (filters: object) => ['admin', 'users', filters] as const,
  reviews: (tab: string) => ['admin', 'reviews', tab] as const,
  analytics: (range: string) => ['admin', 'analytics', range] as const,
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalMovies: number;
  activeSubscriptions: number;
  recentUsers: User[];
  recentMovies: { _id: string; title: string; createdAt: string }[];
}

export const useAdminDashboard = () =>
  useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/v1/admin/dashboard');
      return data.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

// ─── Admin Movies ─────────────────────────────────────────────────────────────
export const useAdminMovies = (filters: { status?: string; search?: string; category?: string; page?: number }) =>
  useQuery({
    queryKey: adminKeys.movies(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('categoryId', filters.category);
      params.set('page', String(filters.page ?? 1));
      const { data } = await apiClient.get(`/v1/admin/movies?${params}`);
      return data.data;
    },
  });

// ─── Toggle Feature ───────────────────────────────────────────────────────────
export const useFeatureMovieMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      apiClient.patch(`/v1/admin/movies/${id}/feature`, { featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      toast.success('Movie feature status updated');
    },
  });
};

// ─── Delete Movie (Admin) ─────────────────────────────────────────────────────
export const useAdminDeleteMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/admin/movies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      toast.success('Movie deleted');
    },
    onError: () => toast.error('Failed to delete movie'),
  });
};

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const useAdminUsers = (filters: { role?: string; status?: string; search?: string; page?: number }) =>
  useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page ?? 1));
      const { data } = await apiClient.get(`/v1/admin/users?${params}`);
      return data.data;
    },
  });

// ─── Ban / Unban ──────────────────────────────────────────────────────────────
export const useBanUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiClient.post(`/v1/admin/users/${userId}/ban`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User banned');
    },
    onError: () => toast.error('Failed to ban user'),
  });
};

export const useUnbanUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.post(`/v1/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User unbanned');
    },
  });
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const useAdminReviews = (tab: 'pending' | 'approved' | 'rejected') =>
  useQuery({
    queryKey: adminKeys.reviews(tab),
    queryFn: async () => {
      const { data } = await apiClient.get(`/v1/admin/reviews?status=${tab}`);
      return data.data;
    },
  });

export const useReviewActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiClient.patch(`/v1/admin/reviews/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success('Review updated');
    },
  });
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const useAdminAnalytics = (range: '7d' | '30d' | '90d') =>
  useQuery({
    queryKey: adminKeys.analytics(range),
    queryFn: async () => {
      const { data } = await apiClient.get(`/v1/admin/analytics?range=${range}`);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
