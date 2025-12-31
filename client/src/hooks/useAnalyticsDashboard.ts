/**
 * Analytics Dashboard Hook
 *
 * @module UseAnalyticsDashboard
 * @description React Query hooks for analytics dashboard functionality
 */
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import type {
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	TrendQueryOptions,
	UserAnalyticsQuery,
	UserTrendPoint,
} from '@shared/types';
import { analyticsService } from '@/services';
import type { RootState } from '@/types';

/**
 * Hook for getting user analytics
 * @returns Query result with user analytics
 */
export const useUserAnalytics = () => {
	const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

	return useQuery<CompleteUserAnalytics>({
		queryKey: ['UserAnalytics'],
		queryFn: () => analyticsService.getUserAnalytics(),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
		enabled: isAuthenticated,
	});
};

/**
 * Hook for getting popular topics
 * @param query Optional analytics query parameters
 * @returns Query result with popular topics data
 */
export const usePopularTopics = (query?: UserAnalyticsQuery) => {
	const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

	return useQuery({
		queryKey: ['popularTopics', query],
		queryFn: () => analyticsService.getPopularTopics(query),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
		enabled: isAuthenticated,
	});
};

/**
 * Hook for getting global difficulty statistics
 * @returns Query result with global difficulty statistics
 */
export const useGlobalDifficultyStats = () => {
	return useQuery<DifficultyBreakdown>({
		queryKey: ['globalDifficultyStats'],
		queryFn: () => analyticsService.getGlobalDifficultyStats(),
		staleTime: TIME_PERIODS_MS.TEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

/**
 * Hook for getting real-time analytics
 * @returns Query result with real-time analytics (global stats)
 */
export const useRealTimeAnalytics = () => {
	return useQuery<GlobalStatsResponse>({
		queryKey: ['realTimeAnalytics'],
		queryFn: () => analyticsService.getGlobalStats(),
		staleTime: 30 * 1000,
		gcTime: TIME_PERIODS_MS.TWO_MINUTES,
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
		queryFn: () => analyticsService.getGlobalStats(),
		staleTime: TIME_PERIODS_MS.TEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
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
			const result = await analyticsService.getGlobalTrends(query);
			return result.data || [];
		},
		staleTime: TIME_PERIODS_MS.TEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};
