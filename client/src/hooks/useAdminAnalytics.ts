/**
 * Admin Analytics Hooks
 *
 * @module UseAdminAnalytics
 * @description React Query hooks for admin analytics functionality (Admin only)
 */
import { useQuery } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import type { AnalyticsResponse, UserSummaryData } from '@shared/types';

import { apiService } from '../services';

/**
 * Hook for getting user summary by ID (Admin only)
 * @param userId User ID to get summary for
 * @param includeActivity Whether to include activity in summary
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user summary
 */
export const useUserSummaryById = (userId: string, includeActivity: boolean = false, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserSummaryData>>({
		queryKey: ['adminUserSummary', userId, includeActivity],
		queryFn: async () => {
			logger.userInfo('Fetching user summary by ID', { userId });
			const result = await apiService.getUserSummaryById(userId, includeActivity);
			logger.userInfo('User summary fetched successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};
