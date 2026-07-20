import apiClient from '@/services/axios';

export const tmdbApi = {
  search: (query: string, page = 1) => 
    apiClient.get(`/v1/admin/tmdb/search?q=${encodeURIComponent(query)}&page=${page}`).then(res => res.data),
    
  getDetails: (tmdbId: number) => 
    apiClient.get(`/v1/admin/tmdb/movie/${tmdbId}`).then(res => res.data),
};

export const moviesApiHelpers = {
  checkDuplicate: (title: string) => 
    apiClient.get(`/v1/admin/movies/check-duplicate?title=${encodeURIComponent(title)}`).then(res => res.data),
    
  getGenres: () => 
    apiClient.get(`/v1/admin/genres`).then(res => res.data),

  createGenre: (data: { name: string; color?: string }) =>
    apiClient.post(`/v1/admin/genres`, data).then(res => res.data),

  getCategories: () =>
    apiClient.get(`/v1/admin/categories`).then(res => res.data),

  createCategory: (data: { name: string }) =>
    apiClient.post(`/v1/admin/categories`, data).then(res => res.data),

  uploadImage: (file: File, type: 'poster' | 'banner' | 'screenshot' = 'poster') => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/v1/admin/upload?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  createMovie: (data: any) =>
    apiClient.post(`/v1/admin/movies`, data).then(res => res.data),
};
