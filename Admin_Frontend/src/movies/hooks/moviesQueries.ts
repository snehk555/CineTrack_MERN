import { useQuery } from '@tanstack/react-query';
import { tmdbApi, moviesApiHelpers } from '../services/api';

export const useTmdbSearch = (query: string) => {
  return useQuery({
    queryKey: ['tmdb-search', query],
    queryFn: () => tmdbApi.search(query),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTmdbDetail = (tmdbId: number | null) => {
  return useQuery({
    queryKey: ['tmdb-detail', tmdbId],
    queryFn: () => tmdbApi.getDetails(tmdbId!),
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useDuplicateCheck = (title: string) => {
  return useQuery({
    queryKey: ['movie-duplicate', title],
    queryFn: () => moviesApiHelpers.checkDuplicate(title),
    enabled: !!title && title.length >= 3,
    staleTime: 1000 * 60,
  });
};

export const useGenresList = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => moviesApiHelpers.getGenres(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useCreateGenre = () => {
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => moviesApiHelpers.createGenre(data),
  });
};

export const useCategoriesList = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => moviesApiHelpers.getCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (data: { name: string }) => moviesApiHelpers.createCategory(data),
  });
};

import { useMutation } from '@tanstack/react-query';

export const useAddMovie = () => {
  return useMutation({
    mutationFn: (data: any) => moviesApiHelpers.createMovie(data),
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: ({ file, type }: { file: File, type: 'poster' | 'banner' | 'screenshot' }) => moviesApiHelpers.uploadImage(file, type),
  });
};
