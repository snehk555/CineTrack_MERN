import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/axios';
import type { Review, ApiResponse, PaginatedResponse } from '../../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const reviewKeys = {
  all:       ['reviews'] as const,
  byMovie:   (movieId: string) => ['reviews', 'movie', movieId] as const,
  myReview:  (movieId: string) => ['reviews', 'my', movieId]    as const,
};

// ─── GET reviews for a movie (approved only) ──────────────────────────────────
export const useMovieReviews = (movieId: string) =>
  useQuery({
    queryKey: reviewKeys.byMovie(movieId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Review>>>(
        `/v1/reviews/movie/${movieId}?limit=20&page=1`
      );
      return data.data;
    },
    enabled: !!movieId,
  });

// ─── POST — submit a review ───────────────────────────────────────────────────
interface SubmitReviewPayload {
  movieId: string;
  rating: number;
  comment?: string;
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      apiClient.post<ApiResponse<Review>>('/v1/reviews', payload),
    onSuccess: (_, vars) => {
      // Invalidate this movie's reviews so list refreshes
      queryClient.invalidateQueries({ queryKey: reviewKeys.byMovie(vars.movieId) });
      // Invalidate movie detail too (totalReviews count changes)
      queryClient.invalidateQueries({ queryKey: ['movies', 'detail', vars.movieId] });
      toast.success('Review submitted! It will appear after approval. ✅');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to submit review.');
    },
  });
};

// ─── DELETE — user deletes their own review ───────────────────────────────────
export const useDeleteReview = (movieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => apiClient.delete(`/v1/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byMovie(movieId) });
      queryClient.invalidateQueries({ queryKey: ['movies', 'detail', movieId] });
      toast.success('Review deleted.');
    },
    onError: () => {
      toast.error('Failed to delete review.');
    },
  });
};
