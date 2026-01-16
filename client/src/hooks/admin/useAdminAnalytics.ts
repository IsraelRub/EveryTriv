import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, TIME_PERIODS_MS, UserRole } from '@shared/constants';
import type {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
	BusinessMetrics,
	ComparisonQueryOptions,
	SecurityMetrics,
	SystemInsights,
	SystemPerformanceMetrics,
	SystemRecommendation,
	TrendQueryOptions,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import { analyticsService, queryInvalidationService } from '@/services';
import { useUserRole } from '../useAuth';

export const useUserSummaryById = (userId: string, includeActivity: boolean = false, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserSummaryData>>({
		queryKey: QUERY_KEYS.admin.userSummary(userId, includeActivity),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserSummaryById(userId, includeActivity);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserStatisticsById = (userId: string, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserAnalyticsRecord>>({
		queryKey: QUERY_KEYS.admin.userStatistics(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserStatisticsById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserPerformanceById = (userId: string, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserPerformanceMetrics>>({
		queryKey: QUERY_KEYS.admin.userPerformance(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserPerformanceById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserProgressById = (userId: string, params?: TrendQueryOptions, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserProgressAnalytics>>({
		queryKey: QUERY_KEYS.admin.userProgress(userId, params),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserProgressById(userId, params);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserActivityById = (
	userId: string,
	limit?: number,
	startDate?: Date | string,
	endDate?: Date | string,
	enabled?: boolean
) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<ActivityEntry[]>>({
		queryKey: QUERY_KEYS.admin.userActivity(userId, { limit, startDate, endDate }),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserActivityById(userId, limit, startDate, endDate);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useUserInsightsById = (userId: string, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserInsightsData>>({
		queryKey: QUERY_KEYS.admin.userInsights(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserInsightsById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserRecommendationsById = (userId: string, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<SystemRecommendation[]>>({
		queryKey: QUERY_KEYS.admin.userRecommendations(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserRecommendationsById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserAchievementsById = (userId: string, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<Achievement[]>>({
		queryKey: QUERY_KEYS.admin.userAchievements(userId),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getUserAchievementsById(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserTrendsById = (userId: string, params?: TrendQueryOptions, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserTrendPoint[]>>({
		queryKey: QUERY_KEYS.admin.userTrends(userId, params),
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

export const useUserComparisonById = (userId: string, params?: ComparisonQueryOptions, enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<AnalyticsResponse<UserComparisonResult>>({
		queryKey: QUERY_KEYS.admin.userComparison(userId, params),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.compareUserPerformanceById(userId, params);
		},
		enabled: enabled !== undefined ? enabled && isAdmin : !!userId && isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useClearAllUserStats = () => {
	const queryClient = useQueryClient();
	const userRole = useUserRole();
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
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.analytics() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userAnalytics() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userSummary() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userStatistics() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userPerformance() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userProgress() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userActivity() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userInsights() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userRecommendations() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userAchievements() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userTrends() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userComparison() });
		},
	});
};

export const useClearAllLeaderboard = () => {
	const queryClient = useQueryClient();
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			const result = await analyticsService.clearAllLeaderboard();
			return result;
		},
		onSuccess: () => {
			// Invalidate related queries
			queryInvalidationService.invalidateLeaderboardQueries(queryClient);
		},
	});
};

export const useBusinessMetrics = (enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<BusinessMetrics>({
		queryKey: QUERY_KEYS.admin.businessMetrics(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getBusinessMetrics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
	});
};

export const useSystemPerformanceMetrics = (enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<SystemPerformanceMetrics>({
		queryKey: QUERY_KEYS.admin.systemPerformance(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getSystemPerformanceMetrics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
		refetchInterval: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useSystemSecurityMetrics = (enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<SecurityMetrics>({
		queryKey: QUERY_KEYS.admin.systemSecurity(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getSystemSecurityMetrics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
		refetchInterval: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useSystemRecommendations = (enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<SystemRecommendation[]>({
		queryKey: QUERY_KEYS.admin.systemRecommendations(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getSystemRecommendations();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useSystemInsights = (enabled?: boolean) => {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery<SystemInsights>({
		queryKey: QUERY_KEYS.admin.systemInsights(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getSystemInsights();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};
