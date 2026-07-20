// ─── Core User & Auth Types ────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'super_admin';
export type SubscriptionPlan = 'free' | 'premium' | 'pro';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  isActive: boolean;
  isBanned: boolean;
  suspendedUntil?: string;
  createdAt: string;
  lastLoginAt?: string;
}

// ─── Movie Types ───────────────────────────────────────────────────────────

export type MovieStatus = 'draft' | 'published' | 'scheduled' | 'processing';
export type ContentType = 'movie' | 'series';

export interface Movie {
  _id: string;
  title: string;
  description: string;
  releaseYear: number;
  duration: number;
  language: string;
  status: MovieStatus;
  type: ContentType;
  genres: string[];
  poster?: string;
  banner?: string;
  avgRating: number;
  watchlistCount: number;
  isFeatured: boolean;
  publishAt?: string;
  createdAt: string;
}

// ─── Review Types ──────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  _id: string;
  userId: string;
  userName: string;
  movieId: string;
  movieTitle: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  rejectionReason?: string;
  createdAt: string;
}

// ─── Audit Log Types ───────────────────────────────────────────────────────

export type AuditAction =
  | 'USER_BANNED'
  | 'USER_SUSPENDED'
  | 'USER_PROMOTED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PLAN_CHANGED'
  | 'USER_IMPERSONATED'
  | 'USER_DATA_EXPORTED'
  | 'MOVIE_PUBLISHED'
  | 'MOVIE_DELETED'
  | 'MOVIE_SCHEDULED_PUBLISHED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'GENRE_CREATED'
  | 'GENRE_DELETED'
  | 'FEATURE_FLAG_TOGGLED'
  | 'PLAN_PRICE_CHANGED'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_LOGOUT';

export interface AuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── API Response Wrapper ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
