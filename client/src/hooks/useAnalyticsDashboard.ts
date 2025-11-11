/**
 * Analytics Dashboard Hook
 *
 * @module UseAnalyticsDashboard
 * @description React Query hooks for analytics dashboard functionality
 */
import { useQuery } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import type {
	AnalyticsResponse,
	Achievement,
	ActivityEntry,
	CompleteUserAnalytics,
	SystemRecommendation,
	UserAnalytics,
	UserAnalyticsQuery,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';

import { apiService } from '../services';

export const useUserStatsById = (userId?: string) =>
	useQuery<AnalyticsResponse<UserAnalytics>>({
		queryKey: ['userStats', userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserStatisticsById(userId);
		},
	});

export const useUserPerformanceById = (userId?: string) =>
	useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
		queryKey: ['userPerformance', userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserPerformanceById(userId);
		},
	});

export const useUserProgressById = (
	userId: string | undefined,
	params?: Parameters<typeof apiService.getUserProgressById>[1]
) =>
	useQuery<AnalyticsResponse<UserProgressAnalytics>>({
		queryKey: ['userProgressById', userId, params ? JSON.stringify(params) : undefined],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserProgressById(userId, params);
		},
	});

export const useUserActivityById = (
	userId: string | undefined,
	params?: Parameters<typeof apiService.getUserActivityById>[1]
) =>
	useQuery<AnalyticsResponse<ActivityEntry[]>>({
		queryKey: ['userActivityById', userId, params ? JSON.stringify(params) : undefined],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserActivityById(userId, params);
		},
	});

export const useUserInsightsById = (userId?: string) =>
	useQuery<AnalyticsResponse<UserInsightsData>>({
		queryKey: ['userInsightsById', userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserInsightsById(userId);
		},
	});

export const useUserRecommendationsById = (userId?: string) =>
	useQuery<AnalyticsResponse<SystemRecommendation[]>>({
		queryKey: ['userRecommendationsById', userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserRecommendationsById(userId);
		},
	});

export const useUserAchievementsById = (userId?: string) =>
	useQuery<AnalyticsResponse<Achievement[]>>({
		queryKey: ['userAchievementsById', userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserAchievementsById(userId);
		},
	});

export const useUserTrendsById = (
	userId: string | undefined,
	params?: Parameters<typeof apiService.getUserTrendsById>[1]
) =>
	useQuery<AnalyticsResponse<UserTrendPoint[]>>({
		queryKey: ['userTrendsById', userId, params ? JSON.stringify(params) : undefined],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserTrendsById(userId, params);
		},
	});

export const useUserComparisonById = (
	userId: string | undefined,
	params?: Parameters<typeof apiService.compareUserPerformanceById>[1]
) =>
	useQuery<AnalyticsResponse<UserComparisonResult>>({
		queryKey: ['userComparisonById', userId, params ? JSON.stringify(params) : undefined],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.compareUserPerformanceById(userId, params);
		},
	});

export const useUserSummaryById = (userId: string | undefined, includeActivity = false) =>
	useQuery<AnalyticsResponse<UserSummaryData>>({
		queryKey: ['userSummaryById', userId, includeActivity],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				throw new Error('userId is required');
			}
			return apiService.getUserSummaryById(userId, includeActivity);
		},
	});

/**
 * Hook for getting user analytics
 * @returns Query result with user analytics
 */
export const useUserAnalytics = () => {
	return useQuery<CompleteUserAnalytics>({
		queryKey: ['UserAnalytics'],
		queryFn: async () => {
			logger.userInfo('Fetching user analytics');
			const result = await apiService.getUserAnalytics();
			logger.userInfo('user analytics fetched successfully', {
				userId: result.basic?.userId,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting popular topics
 * @param query Optional analytics query parameters
 * @returns Query result with popular topics data
 */
export const usePopularTopics = (query?: UserAnalyticsQuery) => {
	return useQuery({
		queryKey: ['popularTopics', query],
		queryFn: async () => {
			logger.userInfo('Fetching popular topics', { query: query ? JSON.stringify(query) : undefined });
			const result = await apiService.getPopularTopics(query);
			logger.userInfo('Popular topics fetched successfully', {
				totalTopics: result.topics.length,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting difficulty statistics
 * @param query Optional analytics query parameters
 * @returns Query result with difficulty statistics
 */
export const useDifficultyStats = (query?: UserAnalyticsQuery) => {
	return useQuery({
		queryKey: ['difficultyStats', query],
		queryFn: async () => {
			logger.userInfo('Fetching difficulty stats', { query: query ? JSON.stringify(query) : undefined });
			const result = await apiService.getDifficultyStats(query);
			logger.userInfo('Difficulty stats fetched successfully', {
				totalDifficulties: Array.isArray(result.difficulties) ? result.difficulties.length : 0,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

/**
 * Hook for getting real-time analytics
 * @returns Query result with real-time analytics
 */
export const useRealTimeAnalytics = () => {
	return useQuery({
		queryKey: ['realTimeAnalytics'],
		queryFn: async () => {
			logger.userInfo('Fetching real-time analytics');
			const result = await apiService.getUserAnalytics();
			logger.userInfo('Real-time analytics fetched successfully');
			return result;
		},
		staleTime: 30 * 1000,
		gcTime: 2 * 60 * 1000,
		refetchInterval: 30 * 1000,
	});
};

/**
 * Hook for getting analytics export data
 * @param format Export format (csv, json, pdf)
 * @returns Query result with export data
 */
export const useAnalyticsExport = (format: 'csv' | 'json' | 'pdf' = 'json') => {
	return useQuery({
		queryKey: ['analyticsExport', format],
		queryFn: async () => {
			logger.userInfo('Exporting analytics data', { format });
			const result = await apiService.getUserAnalytics();
			logger.userInfo('Analytics data exported successfully', { format });
			return result;
		},
		staleTime: 0,
		gcTime: 5 * 60 * 1000,
		enabled: false,
	});
};
