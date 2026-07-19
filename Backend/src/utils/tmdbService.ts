import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const tmdb = axios.create({
  baseURL: env.TMDB_BASE_URL,
  params: { api_key: env.TMDB_API_KEY },
  timeout: 8000,
});

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime?: number;
  original_language: string;
  vote_average: number;
  vote_count: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; official: boolean }[];
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

// ─── Search movies ─────────────────────────────────────────────────────────
export const searchTmdbMovies = async (query: string, page = 1) => {
  try {
    const { data } = await tmdb.get('/search/movie', {
      params: { query, page, include_adult: false },
    });
    return {
      results: data.results.map((m: TmdbMovie) => ({
        tmdbId: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
        releaseYear: m.release_date ? new Date(m.release_date).getFullYear() : null,
        voteAverage: m.vote_average,
      })),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch (err) {
    logger.error('TMDB search failed', { query, err });
    throw err;
  }
};

// ─── Get full movie details (with credits + videos) ────────────────────────
export const getTmdbMovieDetails = async (tmdbId: number): Promise<{
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
  runtime: number | null;
  language: string;
  genres: { id: number; name: string }[];
  cast: { name: string; character: string; profilePath: string | null }[];
  directors: string[];
  trailerUrl: string | null;
}> => {
  try {
    const { data } = await tmdb.get<TmdbMovie>(`/movie/${tmdbId}`, {
      params: { append_to_response: 'credits,videos' },
    });

    const directors = (data.credits?.crew ?? [])
      .filter((c) => c.job === 'Director')
      .map((c) => c.name);

    const cast = (data.credits?.cast ?? []).slice(0, 10).map((c) => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}${c.profile_path}` : null,
    }));

    const trailer = (data.videos?.results ?? []).find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    ) ?? (data.videos?.results ?? []).find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    return {
      tmdbId: data.id,
      title: data.title,
      overview: data.overview,
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null,
      backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : null,
      releaseYear: data.release_date ? new Date(data.release_date).getFullYear() : null,
      runtime: data.runtime ?? null,
      language: data.original_language,
      genres: data.genres ?? [],
      cast,
      directors,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    };
  } catch (err) {
    logger.error('TMDB detail fetch failed', { tmdbId, err });
    throw err;
  }
};
