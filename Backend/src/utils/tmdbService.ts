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
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
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
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string }[];
    }[];
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

// ─── Search movies / tv ───────────────────────────────────────────────────
export const searchTmdbMovies = async (query: string, page = 1, type: 'multi' | 'movie' | 'tv' = 'multi') => {
  try {
    const endpoint = `/search/${type}`;
    const { data } = await tmdb.get(endpoint, {
      params: { query, page, include_adult: false },
    });

    // For /search/multi, filter out people — only keep movie/tv results.
    // For /search/movie or /search/tv, media_type is NOT returned by TMDB,
    // so we use ALL results directly (they already match the requested type).
    const filteredResults = type === 'multi'
      ? data.results.filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv')
      : data.results;

    return {
      results: filteredResults.map((m: any) => ({
        tmdbId: m.id,
        mediaType: m.media_type || type, // fallback to type if endpoint is not multi
        title: m.title || m.name,
        overview: m.overview,
        posterPath: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
        releaseYear: (m.release_date || m.first_air_date) ? new Date(m.release_date || m.first_air_date).getFullYear() : null,
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

// ─── Get full details (Movie or TV) ────────────────────────
export const getTmdbMovieDetails = async (tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<{
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
  runtime: number | null;
  spokenLanguage: string;
  averageRating: number | null;
  totalRatings: number | null;
  genres: { id: number; name: string }[];
  cast: { name: string; character: string; profilePath: string | null }[];
  directors: string[];
  trailerUrl: string | null;
  contentRating: 'U' | 'U/A' | 'A';
  totalSeasons?: number;
  totalEpisodes?: number;
}> => {
  try {
    const endpoint = mediaType === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
    
    // For TV shows, content_ratings is used instead of release_dates
    const append = mediaType === 'tv' ? 'credits,videos,content_ratings' : 'credits,videos,release_dates';
    
    const { data } = await tmdb.get<any>(endpoint, {
      params: { append_to_response: append },
    });

    const directors = (data.credits?.crew ?? [])
      .filter((c: any) => c.job === 'Director')
      .map((c: any) => c.name);

    const cast = (data.credits?.cast ?? []).slice(0, 10).map((c: any) => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}${c.profile_path}` : null,
    }));

    const trailer = (data.videos?.results ?? []).find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    ) ?? (data.videos?.results ?? []).find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    // Extract Content Rating
    let contentRating: 'U' | 'U/A' | 'A' = 'U/A';
    
    if (mediaType === 'movie' && data.release_dates?.results) {
      const inRelease = data.release_dates.results.find((r: any) => r.iso_3166_1 === 'IN');
      const usRelease = data.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
      const release = inRelease || usRelease;
      
      if (release && release.release_dates.length > 0) {
        const cert = release.release_dates.find((d: any) => d.certification)?.certification || '';
        if (['U', 'G', 'PG', 'TV-Y', 'TV-G'].includes(cert)) contentRating = 'U';
        else if (['U/A', 'UA', 'PG-13', 'TV-14', '12A', '15'].includes(cert)) contentRating = 'U/A';
        else if (['A', 'R', 'NC-17', 'TV-MA', '18'].includes(cert)) contentRating = 'A';
      }
    } else if (mediaType === 'tv' && data.content_ratings?.results) {
      const inRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'IN');
      const usRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
      const rating = inRating || usRating;
      
      if (rating) {
        const cert = rating.rating || '';
        if (['U', 'G', 'PG', 'TV-Y', 'TV-G', 'TV-Y7'].includes(cert)) contentRating = 'U';
        else if (['U/A', 'UA', 'PG-13', 'TV-14', '12A', '15'].includes(cert)) contentRating = 'U/A';
        else if (['A', 'R', 'NC-17', 'TV-MA', '18'].includes(cert)) contentRating = 'A';
      }
    }
    
    const releaseDateObj = data.release_date || data.first_air_date;
    const runtimeVal = mediaType === 'movie' ? data.runtime : (data.episode_run_time?.[0] ?? null);

    return {
      tmdbId: data.id,
      title: data.title || data.name,
      overview: data.overview,
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null,
      backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : null,
      releaseYear: releaseDateObj ? new Date(releaseDateObj).getFullYear() : null,
      runtime: runtimeVal ?? null,
      spokenLanguage: data.original_language,
      averageRating: data.vote_average ?? 0,
      totalRatings: data.vote_count ?? 0,
      genres: data.genres ?? [],
      cast,
      directors,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      contentRating,
      totalSeasons: mediaType === 'tv' ? data.number_of_seasons : undefined,
      totalEpisodes: mediaType === 'tv' ? data.number_of_episodes : undefined,
    };
  } catch (err) {
    logger.error('TMDB detail fetch failed', { tmdbId, err });
    throw err;
  }
};
