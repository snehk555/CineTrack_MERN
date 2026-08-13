import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/axios';
import { useAppSelector } from '../../../store';
import type { Movie, Season, Episode, PaginatedResponse, ApiResponse } from '../../../types';

export const seriesKeys = {
  all: ['series'] as const,
  lists: () => [...seriesKeys.all, 'list'] as const,
  list: (filters: object) => [...seriesKeys.lists(), filters] as const,
  detail: (id: string) => [...seriesKeys.all, 'detail', id] as const,
  seasons: (id: string) => [...seriesKeys.all, 'seasons', id] as const,
  episodes: (seasonId: string) => [...seriesKeys.all, 'episodes', seasonId] as const,
};

export const usePublicSeriesList = (overrideFilters?: { page?: number; limit?: number }) => {
  const filters = useAppSelector((state) => state.filters);

  return useQuery({
    queryKey: seriesKeys.list({ ...filters, ...overrideFilters }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.genre) params.set('genreId', filters.genre);
      params.set('sortBy', filters.sortBy);
      params.set('order', filters.order);
      params.set('page', String(overrideFilters?.page ?? filters.page));
      params.set('limit', String(overrideFilters?.limit ?? filters.limit));

      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Movie>>>(
        `/v1/series?${params.toString()}`
      );
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

export const useSeriesDetail = (id: string) => {
  return useQuery({
    queryKey: seriesKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ series: Movie }>>(`/v1/series/${id}`);
      return data.data.series;
    },
    enabled: !!id,
  });
};

export const useSeasons = (seriesId: string) => {
  return useQuery({
    queryKey: seriesKeys.seasons(seriesId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Season[]>>(`/v1/series/${seriesId}/seasons`);
      return data.data;
    },
    enabled: !!seriesId,
  });
};

export const useEpisodes = (seriesId: string, seasonId: string | null) => {
  return useQuery({
    queryKey: seriesKeys.episodes(seasonId!),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Episode[]>>(`/v1/series/${seriesId}/seasons/${seasonId}/episodes`);
      return data.data;
    },
    enabled: !!seriesId && !!seasonId,
  });
};
