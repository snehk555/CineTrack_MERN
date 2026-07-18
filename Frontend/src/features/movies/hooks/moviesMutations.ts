import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/axios';
import { useAppDispatch, addToWatchlistLocal, removeFromWatchlistLocal } from '../../../store';
import { movieKeys } from './moviesQueries';
import type { Movie, ApiResponse } from '../../../types';

// ─── Add Movie (Admin) ────────────────────────────────────────────────────────
export const useAddMovieMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { searchName?: string; movieDetails?: object; categoryId: string; genreIds: string[] }) =>
      apiClient.post<ApiResponse<{ movie: Movie }>>('/v1/movies/add', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.all });
      toast.success('Movie added successfully!');
    },
    onError: () => {
      toast.error('Failed to add movie. Try again.');
    },
  });
};

// ─── Toggle Watchlist — Optimistic Update ────────────────────────────────────
export const useToggleWatchlist = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, inWatchlist }: { movieId: string; inWatchlist: boolean }) =>
      inWatchlist
        ? apiClient.delete(`/v1/watchlist/${movieId}`)
        : apiClient.post('/v1/watchlist', { movieId }),

    onMutate: async ({ movieId, inWatchlist }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });

      // Snapshot current state for rollback
      const previousIds = queryClient.getQueryData<string[]>(['watchlist', 'ids']);

      // Optimistic update — update Redux immediately
      if (inWatchlist) {
        dispatch(removeFromWatchlistLocal(movieId));
      } else {
        dispatch(addToWatchlistLocal(movieId));
      }

      return { previousIds };
    },

    onError: (_err, { movieId, inWatchlist }, context) => {
      // Rollback on error
      if (inWatchlist) {
        dispatch(addToWatchlistLocal(movieId));
      } else {
        dispatch(removeFromWatchlistLocal(movieId));
      }
      toast.error('Failed to update watchlist');
      if (context?.previousIds) {
        queryClient.setQueryData(['watchlist', 'ids'], context.previousIds);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
};

// ─── Update Movie (Admin) ─────────────────────────────────────────────────────
export const useUpdateMovieMutation = (movieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Movie>) =>
      apiClient.patch<ApiResponse<Movie>>(`/v1/movies/${movieId}`, updates),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(movieKeys.detail(movieId), data.data);
      queryClient.invalidateQueries({ queryKey: movieKeys.lists() });
      toast.success('Movie updated successfully');
    },
    onError: () => {
      toast.error('Failed to update movie');
    },
  });
};

// ─── Delete Movie (Admin) ─────────────────────────────────────────────────────
export const useDeleteMovieMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: string) => apiClient.delete(`/v1/movies/${movieId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.all });
      toast.success('Movie deleted');
    },
    onError: () => {
      toast.error('Failed to delete movie');
    },
  });
};
