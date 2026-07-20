import apiClient from '@/services/axios';

// ─── Dashboard Stats ────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  premiumUsers: number;
  bannedUsers: number;
  newToday: number;
  newYesterday: number;
  userGrowthDelta: number;
}

export interface RegistrationPoint {
  date: string;
  count: number;
}

export interface AuditLogEntry {
  _id: string;
  adminName: string;
  action: string;
  targetName?: string;
  targetType?: string;
  createdAt: string;
}

export interface HealthStatus {
  db:     { status: string; pingMs: number };
  redis:  { status: string; pingMs: number };
  queues: {
    emails: { waiting: number; active: number; completed: number; failed: number };
    media:  { waiting: number; active: number; completed: number; failed: number };
  };
  server: { uptimeSeconds: number; memoryUsedMB: number; nodeVersion: string };
}

export const dashboardApi = {
  getStats:           () => apiClient.get<{ success: boolean; data: DashboardStats }>('/v1/admin/dashboard/stats'),
  getRegistrations:   (days: number) => apiClient.get<{ success: boolean; data: RegistrationPoint[] }>(`/v1/admin/dashboard/registrations?days=${days}`),
  getRecentActivity:  () => apiClient.get<{ success: boolean; data: AuditLogEntry[] }>('/v1/admin/dashboard/recent-activity'),
  getHealth:          () => apiClient.get<{ success: boolean; data: HealthStatus }>('/v1/admin/health'),
  getAuditLogs:       (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient.get<{ success: boolean; data: { data: AuditLogEntry[]; total: number; page: number; totalPages: number } }>(`/v1/admin/audit-logs?${qs}`);
  },
};
