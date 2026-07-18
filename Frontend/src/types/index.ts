export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'premium' | 'moderator' | 'admin';
  avatarUrl?: string;
  bio?: string;
  subscriptionPlan: 'free' | 'pro' | 'premium';
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface Movie {
  _id: string;
  tmdbId: number;
  title: string;
  slug: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  trailerUrl?: string;
  releaseYear?: number;
  runtime?: number;
  language?: string;
  averageRating: number;
  totalRatings: number;
  totalWatchlists: number;
  status: 'published' | 'draft' | 'archived';
  isFeatured: boolean;
  categoryId: Category | string;
  genreIds: (Genre | string)[];
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  thumbnailUrl?: string;
  watchlistCount?: number;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface Genre {
  _id: string;
  name: string;
}

export interface Review {
  _id: string;
  userId: User | string;
  movieId: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  likes: number;
  createdAt: string;
}

export interface WatchlistEntry {
  _id: string;
  userId: string;
  movieId: Movie | string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
