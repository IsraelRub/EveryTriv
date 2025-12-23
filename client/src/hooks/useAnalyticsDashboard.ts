/**
 * Analytics Dashboard Hook
 *
 * @module UseAnalyticsDashboard
 * @description React Query hooks for analytics dashboard functionality
 */
import { useQuery } from '@tanstack/react-query';

import type {
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	TrendQueryOptions,
	UserAnalyticsQuery,
	UserTrendPoint,
} from '@shared/types';

import { analyticsService, clientLogger as logger } from '@/services';

/**
 * Hook for getting user analytics
 * @returns Query result with user analytics
 */
export const useUserAnalytics = () => {
	return useQuery<CompleteUserAnalytics>({
		queryKey: ['UserAnalytics'],
		queryFn: async () => {
			logger.userInfo('Fetching user analytics');
			const result = await analyticsService.getUserAnalytics();
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
			const result = await analyticsService.getPopularTopics(query);
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
 * Hook for getting global difficulty statistics
 * @returns Query result with global difficulty statistics
 */
export const useGlobalDifficultyStats = () => {
	return useQuery<DifficultyBreakdown>({
		queryKey: ['globalDifficultyStats'],
		queryFn: async () => {
			logger.userInfo('Fetching global difficulty stats');
			const result = await analyticsService.getGlobalDifficultyStats();
			logger.userInfo('Global difficulty stats fetched successfully');
			return result;
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
};

/**
 * Hook for getting real-time analytics
 * @returns Query result with real-time analytics (global stats)
 */
export const useRealTimeAnalytics = () => {
	return useQuery<GlobalStatsResponse>({
		queryKey: ['realTimeAnalytics'],
		queryFn: async () => {
			logger.userInfo('Fetching real-time analytics');
			const result = await analyticsService.getGlobalStats();
			logger.userInfo('Real-time analytics fetched successfully');
			return result;
		},
		staleTime: 30 * 1000,
		gcTime: 2 * 60 * 1000,
		refetchInterval: 30 * 1000,
	});
};

/**
 * Hook for getting global statistics for comparison
 * @returns Query result with global statistics
 */
export const useGlobalStats = () => {
	return useQuery({
		queryKey: ['globalStats'],
		queryFn: async () => {
			logger.userInfo('Fetching global stats');
			const result = await analyticsService.getGlobalStats();
			logger.userInfo('Global stats fetched successfully');
			return result;
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
};

/**
 * Hook for getting global trends
 * @param query Optional trend query parameters
 * @returns Query result with global trend data
 */
export const useGlobalTrends = (query?: TrendQueryOptions) => {
	return useQuery<UserTrendPoint[]>({
		queryKey: ['globalTrends', query],
		queryFn: async () => {
			logger.userInfo('Fetching global trends', query ? { query: JSON.stringify(query) } : undefined);
			const result = await analyticsService.getGlobalTrends(query);
			logger.userInfo('Global trends fetched successfully');
			return result.data || [];
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
};
