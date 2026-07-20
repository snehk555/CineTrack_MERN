export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'premium' | 'moderator' | 'admin' | 'super_admin';
  googleId?: string;
  avatarUrl?: string;
  bio?: string;
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'pro';
  isActive: boolean;
  isBanned: boolean;
  suspendedUntil?: string;   // ISO date — null means not suspended
  suspensionReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Movie {
  _id: string;
  tmdbId?: number;
  title: string;
  slug: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  screenshots?: string[];
  trailerUrl?: string;
  releaseYear?: number;
  runtime?: number;
  language?: string;
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
  totalWatchlists: number;
  status: 'published' | 'draft' | 'archived';
  isFeatured: boolean;
  isDeleted?: boolean;
  categoryId?: Category | string;
  genreIds: (Genre | string)[];
  cast?: { name: string; character: string; profilePath?: string }[];
  directors?: string[];
  videoUrls?: Record<string, string>;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt?: string;
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
  slug?: string;
  color?: string;
}

// Phase 4 — status enum replaces isApproved boolean
export interface Review {
  _id: string;
  userId: User | string;
  movieId: Movie | string;
  rating: number;          // 1–10
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  likes: number;
  createdAt: string;
}

export interface WatchlistEntry {
  _id: string;
  userId: string;
  movieId: Movie | string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
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

// Feature flags map returned by GET /api/v1/flags
export type FeatureFlagsMap = Record<string, boolean>;

// Subscription plan from GET /api/v1/plans
export interface SubscriptionPlan {
  key: 'free' | 'premium' | 'pro';
  name: string;
  priceMonthly: number;   // in paise (divide by 100 for ₹)
  priceYearly: number;
  features: string[];
  isActive: boolean;
}
