import { useMutation, useQuery } from '@tanstack/react-query';

import { AnalyticsResult, LeaderboardPeriod, TIME_PERIODS_MS } from '@shared/constants';
import type {
	BasicValue,
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	LeaderboardStats,
	TrackEventResponse,
	TrendQueryOptions,
	UserAnalyticsQuery,
	UserTrendPoint,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { analyticsService, clientLogger as logger } from '@/services';
import { useIsAuthenticated } from './useAuth';

export const useUserAnalytics = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery<CompleteUserAnalytics>({
		queryKey: QUERY_KEYS.analytics.user(),
		queryFn: () => analyticsService.getUserAnalytics(),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		enabled: isAuthenticated,
	});
};

export const usePopularTopics = (query?: UserAnalyticsQuery) => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: [...QUERY_KEYS.analytics.popularTopics(), ...(query ? [query] : [])],
		queryFn: () => analyticsService.getPopularTopics(query),
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
		enabled: isAuthenticated,
	});
};

export const useGlobalDifficultyStats = () => {
	return useQuery<DifficultyBreakdown>({
		queryKey: QUERY_KEYS.analytics.globalDifficultyStats(),
		queryFn: () => analyticsService.getGlobalDifficultyStats(),
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
	});
};

export const useRealTimeAnalytics = () => {
	return useQuery<GlobalStatsResponse>({
		queryKey: QUERY_KEYS.analytics.globalStats(),
		queryFn: () => analyticsService.getGlobalStats(),
		staleTime: TIME_PERIODS_MS.THIRTY_SECONDS,
		gcTime: TIME_PERIODS_MS.TWO_MINUTES,
		refetchInterval: TIME_PERIODS_MS.THIRTY_SECONDS,
	});
};

export const useGlobalStats = () => {
	return useQuery({
		queryKey: QUERY_KEYS.analytics.globalStats(),
		queryFn: () => analyticsService.getGlobalStats(),
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
	});
};

export const useGlobalTrends = (query?: TrendQueryOptions) => {
	return useQuery<UserTrendPoint[]>({
		queryKey: [...QUERY_KEYS.analytics.globalTrends(), ...(query ? [query] : [])],
		queryFn: async () => {
			const result = await analyticsService.getGlobalTrends(query);
			return result.data || [];
		},
		staleTime: TIME_PERIODS_MS.TEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useTrackAnalyticsEvent = () => {
	return useMutation<
		TrackEventResponse,
		Error,
		{
			eventType: string;
			userId?: string;
			sessionId?: string;
			timestamp?: string;
			page?: string;
			action?: string;
			result?: AnalyticsResult;
			duration?: number;
			value?: number;
			properties?: Record<string, BasicValue>;
		}
	>({
		mutationFn: eventData => analyticsService.trackAnalyticsEvent(eventData),
		onError: error => {
			// Silent fail - log error but don't throw to prevent app crashes
			logger.apiDebug('Failed to track analytics event', {
				errorInfo: { message: getErrorMessage(error) },
			});
		},
	});
};

export const useGlobalLeaderboard = (limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: QUERY_KEYS.leaderboard.global(limit, offset),
		queryFn: () => analyticsService.getGlobalLeaderboard(limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useLeaderboardByPeriod = (period: LeaderboardPeriod, limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: [...QUERY_KEYS.leaderboard.byPeriod(period, limit), offset], // offset not part of cache key, added here
		queryFn: () => analyticsService.getLeaderboardByPeriod(period, limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useLeaderboardStats = (period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY) => {
	return useQuery<LeaderboardStats>({
		queryKey: QUERY_KEYS.leaderboard.stats(period),
		queryFn: () => analyticsService.getLeaderboardStats(period),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};
