import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/axios';
import { useAppSelector } from '../../../store';
import type { Movie, PaginatedResponse, ApiResponse } from '../../../types';

// ─── Query Key Factory ────────────────────────────────────────────────────────
export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (filters: object) => [...movieKeys.lists(), filters] as const,
  detail: (id: string) => [...movieKeys.all, 'detail', id] as const,
  trending: () => [...movieKeys.all, 'trending'] as const,
};

// ─── Movie List with Filters from Redux ──────────────────────────────────────
export const useMovies = () => {
  const filters = useAppSelector((state) => state.filters);

  return useQuery({
    queryKey: movieKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('categoryId', filters.category);
      if (filters.genre) params.set('genreId', filters.genre);
      params.set('sortBy', filters.sortBy);
      params.set('order', filters.order);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));

      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Movie>>>(
        `/v1/movies?${params.toString()}`
      );
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

// ─── Movie Detail ─────────────────────────────────────────────────────────────
export const useMovieDetail = (id: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ movie: Movie }>>(`/v1/movies/${id}`);
      return data.data.movie;
    },
    enabled: !!id,
    initialData: () => {
      const cached = queryClient.getQueryData<PaginatedResponse<Movie>>(movieKeys.lists());
      return cached?.data.find((m) => m._id === id);
    },
  });
};

// ─── Trending ─────────────────────────────────────────────────────────────────
export const useTrendingMovies = () => {
  return useQuery({
    queryKey: movieKeys.trending(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Movie[]>>('/v1/movies/trending');
      return data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
};

// ─── Infinite Scroll ──────────────────────────────────────────────────────────
export const useInfiniteMovies = () => {
  const filters = useAppSelector((state) => state.filters);

  return useInfiniteQuery({
    queryKey: [...movieKeys.list(filters), 'infinite'] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('categoryId', filters.category);
      if (filters.genre) params.set('genreId', filters.genre);
      params.set('sortBy', filters.sortBy);
      params.set('order', filters.order);
      params.set('page', String(pageParam));
      params.set('limit', String(filters.limit));

      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Movie>>>(
        `/v1/movies?${params.toString()}`
      );
      return data.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
  });
};

// ─── Categories & Genres ──────────────────────────────────────────────────────
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/categories');
      return data.data;
    },
    staleTime: Infinity,
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/genres');
      return data.data;
    },
    staleTime: Infinity,
  });
};
