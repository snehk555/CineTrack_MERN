import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/axios';
import type { FeatureFlagsMap } from '../../types';

/**
 * Fetches feature flags from GET /api/v1/flags (public endpoint — no auth needed).
 * Flags are cached for 5 minutes and stale-while-revalidate.
 *
 * Usage:
 *   const { isEnabled } = useFeatureFlags();
 *   if (isEnabled('new_review_system')) { ... }
 */
export function useFeatureFlags() {
  const { data: flags, isLoading } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: FeatureFlagsMap }>(
        '/v1/flags'
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime:    10 * 60 * 1000,  // keep in cache 10 min
    retry: false,               // don't retry — flags are non-critical
  });

  const isEnabled = (flagKey: string): boolean => {
    if (isLoading || !flags) return false;
    return flags[flagKey] === true;
  };

  return { flags: flags ?? {}, isEnabled, isLoading };
}
