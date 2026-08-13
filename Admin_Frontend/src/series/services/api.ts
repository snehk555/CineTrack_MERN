import apiClient from '@/services/axios';

export const seriesApi = {
  list: (params: any) => apiClient.get('/v1/admin/series', { params }).then(res => res.data),
  getDetails: (id: string) => apiClient.get(`/v1/admin/series/${id}`).then(res => res.data),
  createSeries: (data: any) => apiClient.post('/v1/admin/series', data).then(res => res.data),
  updateSeries: (id: string, data: any) => apiClient.patch(`/v1/admin/series/${id}`, data).then(res => res.data),
  addSeason: (id: string, seasonNumber: number) => apiClient.post(`/v1/admin/series/${id}/seasons`, { seasonNumber }).then(res => res.data),
  fetchTmdbEpisodeData: (id: string, seasonNumber: number, episodeNumber: number) => apiClient.get(`/v1/admin/series/${id}/tmdb/season/${seasonNumber}/episode/${episodeNumber}`).then(res => res.data),
  saveDetailedEpisode: (id: string, data: any) => apiClient.post(`/v1/admin/series/${id}/episodes`, data).then(res => res.data),
  getSeasons: (id: string) => apiClient.get(`/v1/admin/series/${id}/seasons`).then(res => res.data),
  getEpisodes: (seriesId: string, seasonId: string) => apiClient.get(`/v1/admin/series/${seriesId}/seasons/${seasonId}/episodes`).then(res => res.data),
  updateEpisodeVideo: (episodeId: string, videoUrl: string, quality: string) => apiClient.patch(`/v1/admin/episodes/${episodeId}/video`, { videoUrl, quality }).then(res => res.data),
  updateSeriesStatus: (id: string, status: string) => apiClient.patch(`/v1/admin/series/${id}/status`, { status }).then(res => res.data),
  updateEpisodeStatus: (episodeId: string, status: string) => apiClient.patch(`/v1/admin/episodes/${episodeId}/status`, { status }).then(res => res.data),
  uploadEpisodeVideoFile: (file: File, onUploadProgress?: (event: any) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/v1/admin/upload-video', formData, {
      timeout: 0,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }).then(res => res.data);
  },
};
