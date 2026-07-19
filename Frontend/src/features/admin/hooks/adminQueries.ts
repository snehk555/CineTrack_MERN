import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/axios';
import type { ApiResponse, User, Movie } from '../../../types';

// ─── Key Factory ──────────────────────────────────────────────────────────────
export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  movies: (filters: object) => ['admin', 'movies', filters] as const,
  users: (filters: object) => ['admin', 'users', filters] as const,
  reviews: (tab: string) => ['admin', 'reviews', tab] as const,
  analytics: (range: string) => ['admin', 'analytics', range] as const,
  tmdbSearch: (q: string) => ['admin', 'tmdb', 'search', q] as const,
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    byRole: { _id: string; count: number }[];
  };
  movies: {
    total: number;
    byStatus: { _id: string; count: number }[];
  };
  subscriptions: { active: number };
  reviews: { pending: number };
  recentUsers: User[];
  recentMovies: (Movie & { _id: string })[];
}

export const useAdminDashboard = () =>
  useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/v1/admin/analytics/dashboard');
      return data.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsData {
  range: string;
  userGrowth: { date: string; count: number }[];
  topMovies: Pick<Movie, '_id' | 'title' | 'averageRating' | 'totalWatchlists' | 'posterPath'>[];
  genreDistribution: { name: string; count: number }[];
  subscriptionDistribution: { plan: string; count: number }[];
  kpis: { totalRevenue: number; avgRating: number; totalWatchlists: number };
}

export const useAdminAnalytics = (range: '7d' | '30d' | '90d') =>
  useQuery({
    queryKey: adminKeys.analytics(range),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AnalyticsData>>(`/v1/admin/analytics?range=${range}`);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

// ─── Admin Movies ─────────────────────────────────────────────────────────────
export interface AdminMoviesResult {
  movies: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useAdminMovies = (filters: {
  status?: string;
  search?: string;
  page?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}) =>
  useQuery({
    queryKey: adminKeys.movies(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.order) params.set('order', filters.order);
      params.set('page', String(filters.page ?? 1));
      const { data } = await apiClient.get<ApiResponse<AdminMoviesResult>>(`/v1/admin/movies?${params}`);
      return data.data;
    },
  });

export const useAddMovieMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.post('/v1/admin/movies', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Movie added successfully');
    },
    onError: () => toast.error('Failed to add movie'),
  });
};

export const useUpdateMovieStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/v1/admin/movies/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      toast.success('Movie status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });
};

export const useFeatureMovieMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featuredUntil }: { id: string; featuredUntil?: string }) =>
      apiClient.patch(`/v1/admin/movies/${id}/feature`, { featuredUntil }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      toast.success('Movie featured');
    },
  });
};

export const useAdminDeleteMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/admin/movies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Movie deleted');
    },
    onError: () => toast.error('Failed to delete movie'),
  });
};

// ─── Admin Users ──────────────────────────────────────────────────────────────
export interface AdminUsersResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useAdminUsers = (filters: {
  role?: string;
  isBanned?: boolean;
  search?: string;
  page?: number;
}) =>
  useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.isBanned !== undefined) params.set('isBanned', String(filters.isBanned));
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page ?? 1));
      const { data } = await apiClient.get<ApiResponse<AdminUsersResult>>(`/v1/admin/users?${params}`);
      return data.data;
    },
  });

export const useBanUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiClient.patch(`/v1/admin/users/${userId}/ban`, { reason }),
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
    mutationFn: (userId: string) => apiClient.patch(`/v1/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User unbanned');
    },
  });
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface ReviewWithDetails {
  _id: string;
  userId: { _id: string; name: string; email: string; avatarUrl?: string };
  movieId: { _id: string; title: string; posterPath?: string };
  rating: number;
  comment?: string;
  isApproved: boolean;
  likes: number;
  createdAt: string;
}

export interface AdminReviewsResult {
  reviews: ReviewWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

export const useAdminReviews = (tab: 'pending' | 'approved' | 'rejected', page = 1) =>
  useQuery({
    queryKey: adminKeys.reviews(tab),
    queryFn: async () => {
      const status = tab === 'pending' ? 'pending' : tab === 'approved' ? 'approved' : undefined;
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      const { data } = await apiClient.get<ApiResponse<AdminReviewsResult>>(`/v1/admin/reviews?${params}`);
      return data.data;
    },
  });

export const useApproveReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/v1/admin/reviews/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Review approved');
    },
  });
};

export const useRejectReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Review rejected');
    },
  });
};

// ─── TMDB Search ──────────────────────────────────────────────────────────────
export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseYear: number | null;
  voteAverage: number;
}

export const useTmdbSearch = (query: string, enabled: boolean) =>
  useQuery({
    queryKey: adminKeys.tmdbSearch(query),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ results: TmdbSearchResult[] }>>(
        `/v1/admin/tmdb/search?q=${encodeURIComponent(query)}`
      );
      return data.data.results;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

export const useTmdbMovieDetails = (tmdbId: number | null) =>
  useQuery({
    queryKey: ['admin', 'tmdb', 'detail', tmdbId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v1/admin/tmdb/movie/${tmdbId}`);
      return data.data;
    },
    enabled: tmdbId !== null,
    staleTime: 10 * 60 * 1000,
  });
