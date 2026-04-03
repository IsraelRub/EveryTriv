import { useQuery } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constants';
import type {
	AnalyticsResponse,
	SystemRecommendation,
	UserAnalyticsRecord,
	UserInsightsData,
	UserPerformanceMetrics,
	UserSummaryData,
} from '@shared/types';

import { QUERY_CACHE_PRESETS, QUERY_KEYS } from '@/constants';
import { analyticsService } from '@/services';
import { useUserRole } from '@/hooks/useAuth';

export interface UseAdminUserPanelQueriesResult {
	userSummary: AnalyticsResponse<UserSummaryData> | undefined;
	summaryLoading: boolean;
	summaryError: boolean;
	userStatistics: AnalyticsResponse<UserAnalyticsRecord> | undefined;
	statisticsLoading: boolean;
	userPerformance: AnalyticsResponse<UserPerformanceMetrics> | undefined;
	performanceLoading: boolean;
	userInsights: AnalyticsResponse<UserInsightsData> | undefined;
	insightsLoading: boolean;
	userRecommendations: AnalyticsResponse<SystemRecommendation[]> | undefined;
	recommendationsLoading: boolean;
}

export function useAdminUserPanelQueries(selectedUserId: string | null): UseAdminUserPanelQueriesResult {
	const { isAdmin } = useUserRole();
	const userId = selectedUserId ?? '';
	const enabled = Boolean(isAdmin && selectedUserId);

	const summaryQuery = useQuery<AnalyticsResponse<UserSummaryData>>({
		queryKey: QUERY_KEYS.admin.userSummary(userId, false),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserSummaryById(userId, false);
		},
		enabled,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});

	const statisticsQuery = useQuery<AnalyticsResponse<UserAnalyticsRecord>>({
		queryKey: QUERY_KEYS.admin.userStatistics(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserStatisticsById(userId);
		},
		enabled,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});

	const performanceQuery = useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
		queryKey: QUERY_KEYS.admin.userPerformance(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserPerformanceById(userId);
		},
		enabled,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});

	const insightsQuery = useQuery<AnalyticsResponse<UserInsightsData>>({
		queryKey: QUERY_KEYS.admin.userInsights(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserInsightsById(userId);
		},
		enabled,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});

	const recommendationsQuery = useQuery<AnalyticsResponse<SystemRecommendation[]>>({
		queryKey: QUERY_KEYS.admin.userRecommendations(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserRecommendationsById(userId);
		},
		enabled,
		...QUERY_CACHE_PRESETS.staleFifteenGcThirty,
	});

	return {
		userSummary: summaryQuery.data,
		summaryLoading: summaryQuery.isLoading,
		summaryError: summaryQuery.isError,
		userStatistics: statisticsQuery.data,
		statisticsLoading: statisticsQuery.isLoading,
		userPerformance: performanceQuery.data,
		performanceLoading: performanceQuery.isLoading,
		userInsights: insightsQuery.data,
		insightsLoading: insightsQuery.isLoading,
		userRecommendations: recommendationsQuery.data,
		recommendationsLoading: recommendationsQuery.isLoading,
	};
}
