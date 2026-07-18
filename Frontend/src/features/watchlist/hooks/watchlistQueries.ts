import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import apiClient from '../../../services/axios';
import { useAppDispatch, useAppSelector, setWatchlistIds } from '../../../store';
import type { ApiResponse, WatchlistEntry } from '../../../types';

// ─── Fetch watchlist + sync IDs to Redux ──────────────────────────────────────
export const useWatchlist = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const query = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<WatchlistEntry[]>>('/v1/watchlist');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      const ids = query.data.map((entry) =>
        typeof entry.movieId === 'string' ? entry.movieId : entry.movieId._id
      );
      dispatch(setWatchlistIds(ids));
    }
  }, [query.data, dispatch]);

  return query;
};

// ─── Fast in-watchlist check from Redux (O(1) lookup) ────────────────────────
export const useIsInWatchlist = (movieId: string): boolean => {
  return useAppSelector((state) => state.watchlist.movieIds.includes(movieId));
};
