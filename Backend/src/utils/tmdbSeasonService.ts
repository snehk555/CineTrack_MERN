import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const tmdb = axios.create({
  baseURL: env.TMDB_BASE_URL,
  params: { api_key: env.TMDB_API_KEY },
  timeout: 8000,
});

export const getTmdbSeasonDetails = async (tmdbId: number, seasonNumber: number) => {
  try {
    const { data } = await tmdb.get(`/tv/${tmdbId}/season/${seasonNumber}`);
    return data;
  } catch (err) {
    logger.error('TMDB season fetch failed', { tmdbId, seasonNumber, err });
    throw err;
  }
};

export const getTmdbEpisodeDetails = async (tmdbId: number, seasonNumber: number, episodeNumber: number) => {
  try {
    const { data } = await tmdb.get(`/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}`, {
      params: { append_to_response: 'videos' }
    });
    return data;
  } catch (err) {
    logger.error('TMDB episode fetch failed', { tmdbId, seasonNumber, episodeNumber, err });
    throw err;
  }
};
