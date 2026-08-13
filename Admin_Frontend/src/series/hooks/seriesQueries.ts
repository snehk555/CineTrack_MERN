import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '../services/api';
import { tmdbApi } from '@/movies/services/api';

export const useSeriesList = (params: any) => {
  return useQuery({
    queryKey: ['admin-series', params],
    queryFn: () => seriesApi.list(params),
  });
};

export const useSeriesDetail = (id: string) => {
  return useQuery({
    queryKey: ['admin-series', id],
    queryFn: () => seriesApi.getDetails(id),
    enabled: !!id,
  });
};

export const useCreateSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => seriesApi.createSeries(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-series'] });
    },
  });
};

export const useUpdateSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => seriesApi.updateSeries(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-series'] });
    },
  });
};


export const useSeasons = (seriesId: string) => {
  return useQuery({
    queryKey: ['admin-seasons', seriesId],
    queryFn: () => seriesApi.getSeasons(seriesId),
    enabled: !!seriesId,
  });
};

export const useEpisodes = (seriesId: string, seasonId: string) => {
  return useQuery({
    queryKey: ['admin-episodes', seriesId, seasonId],
    queryFn: () => seriesApi.getEpisodes(seriesId, seasonId),
    enabled: !!seriesId && !!seasonId,
  });
};

export const useAddSeason = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seriesId, seasonNumber }: { seriesId: string, seasonNumber: number }) => seriesApi.addSeason(seriesId, seasonNumber),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-seasons', variables.seriesId] });
      qc.invalidateQueries({ queryKey: ['admin-series', variables.seriesId] });
    },
  });
};

export const useFetchTmdbEpisodeData = () => {
  return useMutation({
    mutationFn: ({ seriesId, seasonNumber, episodeNumber }: { seriesId: string, seasonNumber: number, episodeNumber: number }) => 
      seriesApi.fetchTmdbEpisodeData(seriesId, seasonNumber, episodeNumber),
  });
};

export const useSaveDetailedEpisode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seriesId, data }: { seriesId: string, data: any }) => 
      seriesApi.saveDetailedEpisode(seriesId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-seasons', variables.seriesId] });
      qc.invalidateQueries({ queryKey: ['admin-episodes', variables.seriesId] });
      qc.invalidateQueries({ queryKey: ['admin-series', variables.seriesId] });
    },
  });
};

export const useUpdateEpisodeVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, videoUrl, quality }: { episodeId: string; videoUrl: string; quality: string }) =>
      seriesApi.updateEpisodeVideo(episodeId, videoUrl, quality),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-episodes'] });
    },
  });
};

export const useTmdbTvSearch = (query: string) => {
  return useQuery({
    queryKey: ['tmdb-search-tv', query],
    queryFn: () => tmdbApi.search(query, 'tv'),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSeriesStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      seriesApi.updateSeriesStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-series'] });
    },
  });
};

export const useUpdateEpisodeStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, status }: { episodeId: string; status: string }) =>
      seriesApi.updateEpisodeStatus(episodeId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-episodes'] });
    },
  });
};
