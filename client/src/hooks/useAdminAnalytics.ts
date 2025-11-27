/**
 * Admin Analytics Hooks
 *
 * @module UseAdminAnalytics
 * @description React Query hooks for admin analytics functionality (Admin only)
 */
import { useQuery } from '@tanstack/react-query';

import { TimePeriod } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
	SystemRecommendation,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';

import { apiService } from '../services';

type TrendQueryParams = {
	startDate?: string;
	endDate?: string;
	groupBy?: TimePeriod;
	limit?: number;
};

type ActivityQueryParams = {
	startDate?: string;
	endDate?: string;
	limit?: number;
};

type ComparisonQueryParams = {
	target?: 'global' | 'user';
	targetUserId?: string;
	startDate?: string;
	endDate?: string;
};

/**
 * Hook for getting user statistics by ID (Admin only)
 * @param userId User ID to get statistics for
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user statistics
 */
export const useUserStatisticsById = (userId: string, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserAnalyticsRecord>>({
		queryKey: ['adminUserStatistics', userId],
		queryFn: async () => {
			logger.userInfo('Fetching user statistics by ID', { userId });
			const result = await apiService.getUserStatisticsById(userId);
			logger.userInfo('User statistics fetched successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting user performance metrics by ID (Admin only)
 * @param userId User ID to get performance for
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user performance metrics
 */
export const useUserPerformanceById = (userId: string, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
		queryKey: ['adminUserPerformance', userId],
		queryFn: async () => {
			logger.userInfo('Fetching user performance by ID', { userId });
			const result = await apiService.getUserPerformanceById(userId);
			logger.userInfo('User performance fetched successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting user progress analytics by ID (Admin only)
 * @param userId User ID to get progress for
 * @param params Optional query parameters
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user progress analytics
 */
export const useUserProgressById = (userId: string, params?: TrendQueryParams, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserProgressAnalytics>>({
		queryKey: ['adminUserProgress', userId, params],
		queryFn: async () => {
			const logParams: Record<string, string> = {};
			if (params?.startDate) logParams.startDate = params.startDate;
			if (params?.endDate) logParams.endDate = params.endDate;
			if (params?.groupBy) logParams.groupBy = params.groupBy;
			if (params?.limit !== undefined) logParams.limit = params.limit.toString();
			logger.userInfo('Fetching user progress by ID', {
				userId,
				params: Object.keys(logParams).length > 0 ? logParams : undefined,
			});
			const result = await apiService.getUserProgressById(userId, params);
			logger.userInfo('User progress fetched successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting user activity by ID (Admin only)
 * @param userId User ID to get activity for
 * @param params Optional query parameters
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user activity entries
 */
export const useUserActivityById = (userId: string, params?: ActivityQueryParams, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<ActivityEntry[]>>({
		queryKey: ['adminUserActivity', userId, params],
		queryFn: async () => {
			const logParams: Record<string, string> = {};
			if (params?.startDate) logParams.startDate = params.startDate;
			if (params?.endDate) logParams.endDate = params.endDate;
			if (params?.limit !== undefined) logParams.limit = params.limit.toString();
			logger.userInfo('Fetching user activity by ID', {
				userId,
				params: Object.keys(logParams).length > 0 ? logParams : undefined,
			});
			const result = await apiService.getUserActivityById(userId, params);
			logger.userInfo('User activity fetched successfully', {
				userId,
				count: result.data?.length ?? 0,
			});
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 1 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

/**
 * Hook for getting user insights by ID (Admin only)
 * @param userId User ID to get insights for
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user insights
 */
export const useUserInsightsById = (userId: string, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserInsightsData>>({
		queryKey: ['adminUserInsights', userId],
		queryFn: async () => {
			logger.userInfo('Fetching user insights by ID', { userId });
			const result = await apiService.getUserInsightsById(userId);
			logger.userInfo('User insights fetched successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting user recommendations by ID (Admin only)
 * @param userId User ID to get recommendations for
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user recommendations
 */
export const useUserRecommendationsById = (userId: string, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<SystemRecommendation[]>>({
		queryKey: ['adminUserRecommendations', userId],
		queryFn: async () => {
			logger.userInfo('Fetching user recommendations by ID', { userId });
			const result = await apiService.getUserRecommendationsById(userId);
			logger.userInfo('User recommendations fetched successfully', {
				userId,
				recommendationsCount: result.data?.length ?? 0,
			});
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

/**
 * Hook for getting user achievements by ID (Admin only)
 * @param userId User ID to get achievements for
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user achievements
 */
export const useUserAchievementsById = (userId: string, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<Achievement[]>>({
		queryKey: ['adminUserAchievements', userId],
		queryFn: async () => {
			logger.userInfo('Fetching user achievements by ID', { userId });
			const result = await apiService.getUserAchievementsById(userId);
			logger.userInfo('User achievements fetched successfully', {
				userId,
				count: result.data?.length ?? 0,
			});
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
};

/**
 * Hook for getting user trends by ID (Admin only)
 * @param userId User ID to get trends for
 * @param params Optional query parameters
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user trend data
 */
export const useUserTrendsById = (userId: string, params?: TrendQueryParams, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserTrendPoint[]>>({
		queryKey: ['adminUserTrends', userId, params],
		queryFn: async () => {
			const logParams: Record<string, string> = {};
			if (params?.startDate) logParams.startDate = params.startDate;
			if (params?.endDate) logParams.endDate = params.endDate;
			if (params?.groupBy) logParams.groupBy = params.groupBy;
			if (params?.limit !== undefined) logParams.limit = params.limit.toString();
			logger.userInfo('Fetching user trends by ID', {
				userId,
				params: Object.keys(logParams).length > 0 ? logParams : undefined,
			});
			const result = await apiService.getUserTrendsById(userId, params);
			logger.userInfo('User trends fetched successfully', {
				userId,
				count: result.data?.length ?? 0,
			});
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 1 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

/**
 * Hook for comparing user performance (Admin only)
 * @param userId User ID to compare
 * @param params Optional comparison parameters
 * @param enabled Whether the query is enabled (default: !!userId)
 * @returns Query result with user comparison data
 */
export const useCompareUserPerformance = (userId: string, params?: ComparisonQueryParams, enabled?: boolean) => {
	return useQuery<AnalyticsResponse<UserComparisonResult>>({
		queryKey: ['adminUserComparison', userId, params],
		queryFn: async () => {
			logger.userInfo('Comparing user performance', { userId, params });
			const result = await apiService.compareUserPerformanceById(userId, params);
			logger.userInfo('User comparison completed successfully', { userId });
			return result;
		},
		enabled: enabled !== undefined ? enabled : !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

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
