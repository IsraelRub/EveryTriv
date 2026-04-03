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

import { QUERY_CACHE_PRESETS, QUERY_KEYS } from '@/constants';
import { analyticsService, clientLogger as logger } from '@/services';
import { useIsAuthenticated } from './useAuth';

export const useUserAnalytics = (options?: { staleTime?: number; refetchOnMount?: boolean | 'always' }) => {
	return useQuery<CompleteUserAnalytics>({
		queryKey: QUERY_KEYS.analytics.user(),
		queryFn: () => analyticsService.getUserAnalytics(),
		...QUERY_CACHE_PRESETS.staleThirtyGcOneHour,
		staleTime: options?.staleTime ?? QUERY_CACHE_PRESETS.staleThirtyGcOneHour.staleTime,
		enabled: useIsAuthenticated(),
		refetchOnMount: options?.refetchOnMount ?? 'always',
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

export const usePopularTopics = (query?: UserAnalyticsQuery, options?: { enabled?: boolean; allowGuest?: boolean }) => {
	const isAuthenticated = useIsAuthenticated();
	const enabled =
		options?.allowGuest === true
			? options?.enabled !== false
			: options?.enabled !== undefined
				? options.enabled && isAuthenticated
				: isAuthenticated;

	return useQuery({
		queryKey: [...QUERY_KEYS.analytics.popularTopics(), ...(query ? [query] : [])],
		queryFn: () => analyticsService.getPopularTopics(query),
		...QUERY_CACHE_PRESETS.staleOneHourGcTwoHours,
		enabled,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
};

export const useGlobalDifficultyStats = () => {
	return useQuery<DifficultyBreakdown>({
		queryKey: QUERY_KEYS.analytics.globalDifficultyStats(),
		queryFn: () => analyticsService.getGlobalDifficultyStats(),
		...QUERY_CACHE_PRESETS.staleThirtyGcOneHour,
	});
};

export const useGlobalStats = (realtime: boolean = false) => {
	return useQuery<GlobalStatsResponse>({
		queryKey: QUERY_KEYS.analytics.globalStats(),
		queryFn: () => analyticsService.getGlobalStats(),
		...(realtime ? QUERY_CACHE_PRESETS.staleThirtySecGcTwoMin : QUERY_CACHE_PRESETS.staleThirtyGcOneHour),
		refetchInterval: realtime ? TIME_PERIODS_MS.THIRTY_SECONDS : undefined,
	});
};

export const useGlobalTrends = (query?: TrendQueryOptions) => {
	return useQuery<UserTrendPoint[]>({
		queryKey: [...QUERY_KEYS.analytics.globalTrends(), ...(query ? [query] : [])],
		queryFn: async () => {
			const result = await analyticsService.getGlobalTrends(query);
			return result.data || [];
		},
		...QUERY_CACHE_PRESETS.staleTenGcThirty,
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
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});
};

export const useLeaderboardByPeriod = (period: LeaderboardPeriod, limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: [...QUERY_KEYS.leaderboard.byPeriod(period, limit), offset],
		queryFn: () => analyticsService.getLeaderboardByPeriod(period, limit, offset),
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});
};

export const useLeaderboardStats = (period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY) => {
	return useQuery<LeaderboardStats>({
		queryKey: QUERY_KEYS.leaderboard.stats(period),
		queryFn: () => analyticsService.getLeaderboardStats(period),
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});
};
