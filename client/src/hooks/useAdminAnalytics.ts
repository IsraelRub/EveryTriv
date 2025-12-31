/**
 * Admin Analytics Hooks
 *
 * @module UseAdminAnalytics
 * @description React Query hooks for admin analytics functionality (Admin only)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, TIME_PERIODS_MS, UserRole } from '@shared/constants';
import type {
	AnalyticsResponse,
	ComparisonQueryOptions,
	TrendQueryOptions,
	UserComparisonResult,
	UserPerformanceMetrics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { analyticsService } from '@/services';
import { selectUserRole } from '@/redux/selectors';
import { useAppSelector } from './useRedux';

/**
 * Hook for getting user summary by ID (Admin only)
 * @param userId User ID to get summary for
 * @param includeActivity Whether to include activity in summary
 * @param enabled Whether the query is enabled (default: !!userId && isAdmin)
 * @returns Query result with user summary
 */
export const useUserSummaryById = (userId: string, includeActivity: boolean = false, enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserSummaryData>>({
		queryKey: ['adminUserSummary', userId, includeActivity],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserSummaryById(userId, includeActivity);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

/**
 * Hook for getting user performance metrics by ID (Admin only)
 * @param userId User ID to get performance for
 * @param enabled Whether the query is enabled (default: !!userId && isAdmin)
 * @returns Query result with user performance metrics
 */
export const useUserPerformanceById = (userId: string, enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
		queryKey: ['adminUserPerformance', userId],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserPerformanceById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

/**
 * Hook for getting user trends by ID (Admin only)
 * @param userId User ID to get trends for
 * @param params Optional trend query parameters
 * @param enabled Whether the query is enabled (default: !!userId && isAdmin)
 * @returns Query result with user trend data
 */

export const useUserTrendsById = (userId: string, params?: TrendQueryOptions, enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserTrendPoint[]>>({
		queryKey: ['adminUserTrends', userId, params],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserTrendsById(userId, params);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.MINUTE,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

/**
 * Hook for comparing user performance (Admin only)
 * @param userId User ID to compare
 * @param params Optional comparison query parameters
 * @param enabled Whether the query is enabled (default: !!userId && isAdmin)
 * @returns Query result with user comparison data
 */
export const useUserComparisonById = (userId: string, params?: ComparisonQueryOptions, enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserComparisonResult>>({
		queryKey: ['adminUserComparison', userId, params],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.compareUserPerformanceById(userId, params);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

/**
 * Hook for clearing all user stats (Admin only)
 * @returns Mutation hook for clearing user stats
 */
export const useClearAllUserStats = () => {
	const queryClient = useQueryClient();
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.clearAllUserStats();
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: ['analytics'] });
			queryClient.invalidateQueries({ queryKey: ['userAnalytics'] });
			queryClient.invalidateQueries({ queryKey: ['adminUserSummary'] });
			queryClient.invalidateQueries({ queryKey: ['adminUserPerformance'] });
			queryClient.invalidateQueries({ queryKey: ['adminUserTrends'] });
			queryClient.invalidateQueries({ queryKey: ['adminUserComparison'] });
		},
	});
};
