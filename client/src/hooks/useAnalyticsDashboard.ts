import { useMutation, useQuery } from '@tanstack/react-query';

import { AnalyticsResult, LeaderboardPeriod, TIME_PERIODS_MS } from '@shared/constants';
import type {
	AnalyticsResponse,
	BasicValue,
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	LeaderboardStats,
	TrackEventResponse,
	TrendQueryOptions,
	UnifiedUserAnalyticsResponse,
	UserAnalyticsQuery,
	UserTrendPoint,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { analyticsService, clientLogger as logger } from '@/services';
import { useIsAuthenticated } from './useAuth';

/**
 * User analytics. Default `refetchOnMount: 'always'` for primary views (e.g. Statistics).
 * Pass `refetchOnMount: false` when used "on the side" (e.g. GameSettingsForm) to avoid extra fetches.
 */
export const useUserAnalytics = (options?: { staleTime?: number; refetchOnMount?: boolean | 'always' }) => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery<CompleteUserAnalytics>({
		queryKey: QUERY_KEYS.analytics.user(),
		queryFn: () => analyticsService.getUserAnalytics(),
		staleTime: options?.staleTime ?? TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
		enabled: isAuthenticated,
		refetchOnMount: options?.refetchOnMount ?? 'always',
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	});
};

/** Unified user analytics; `refetchOnMount: 'always'` so primary consumers (e.g. Statistics Performance) stay fresh on mount. */
export const useUnifiedUserAnalytics = (includeSections?: string[]) => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery<AnalyticsResponse<UnifiedUserAnalyticsResponse>>({
		queryKey: [...QUERY_KEYS.analytics.user(), 'unified', ...(includeSections || [])],
		queryFn: () => analyticsService.getUnifiedUserAnalytics(includeSections),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		enabled: isAuthenticated,
		refetchOnMount: 'always',
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	});
};

/** Popular topics; `refetchOnMount: false` — data is secondary and staleTime/polling or invalidation suffice. Use `allowGuest: true` for public display (e.g. Home). */
export const usePopularTopics = (
	query?: UserAnalyticsQuery,
	options?: { enabled?: boolean; allowGuest?: boolean }
) => {
	const isAuthenticated = useIsAuthenticated();
	const enabled =
		options?.allowGuest === true ? (options?.enabled !== false) : (options?.enabled !== undefined ? options.enabled && isAuthenticated : isAuthenticated);

	return useQuery({
		queryKey: [...QUERY_KEYS.analytics.popularTopics(), ...(query ? [query] : [])],
		queryFn: () => analyticsService.getPopularTopics(query),
		staleTime: TIME_PERIODS_MS.HOUR,
		gcTime: TIME_PERIODS_MS.TWO_HOURS,
		enabled,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
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

export const useGlobalStats = (options?: { realtime?: boolean }) => {
	const realtime = options?.realtime ?? false;
	return useQuery<GlobalStatsResponse>({
		queryKey: QUERY_KEYS.analytics.globalStats(),
		queryFn: () => analyticsService.getGlobalStats(),
		staleTime: realtime ? TIME_PERIODS_MS.THIRTY_SECONDS : TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: realtime ? TIME_PERIODS_MS.TWO_MINUTES : TIME_PERIODS_MS.HOUR,
		refetchInterval: realtime ? TIME_PERIODS_MS.THIRTY_SECONDS : undefined,
	});
};

export const useRealTimeAnalytics = () => useGlobalStats({ realtime: true });

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
