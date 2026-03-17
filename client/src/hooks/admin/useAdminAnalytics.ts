import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, TIME_PERIODS_MS } from '@shared/constants';
import type {
	AnalyticsResponse,
	BusinessMetrics,
	SecurityMetrics,
	SystemInsights,
	SystemPerformanceMetrics,
	SystemRecommendation,
	UserAnalyticsRecord,
	UserInsightsData,
	UserPerformanceMetrics,
	UserSummaryData,
} from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import type { AdminPricingResponse, AdminPricingUpdatePayload } from '@/types';
import { adminService, analyticsService, queryInvalidationService } from '@/services';
import { useUserRole } from '../useAuth';

export const useUserSummaryById = (userId: string, includeActivity: boolean = false, enabled?: boolean) => {
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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

export const useUserInsightsById = (userId: string, enabled?: boolean) => {
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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

export const useClearAllUserStats = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

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
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userTrends() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userComparison() });
		},
	});
};

export const useClearAllLeaderboard = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

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

export const useCheckAllUsersConsistency = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.allUsersConsistency(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.checkAllUsersConsistency();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

export const useCheckUserStatsConsistency = (userId: string | null, enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.userStatsConsistency(userId ?? ''),
		queryFn: async () => {
			if (!isAdmin || !userId) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.checkUserStatsConsistency(userId);
		},
		enabled: enabled !== undefined ? enabled && isAdmin && !!userId : isAdmin && !!userId,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

export const useFixUserStatsConsistency = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

	return useMutation({
		mutationFn: async (userId: string) => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.fixUserStatsConsistency(userId);
		},
		onSuccess: (_, userId) => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userStatsConsistency(userId) });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.allUsersConsistency() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userAnalytics() });
		},
	});
};

export const useBusinessMetrics = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

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

export const useAdminPricing = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery<AdminPricingResponse>({
		queryKey: QUERY_KEYS.admin.pricing(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return adminService.getAdminPricing();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.MINUTE,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useUpdateAdminPricing = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: AdminPricingUpdatePayload) => adminService.updateAdminPricing(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.pricing() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.packages() });
		},
	});
};

export const useSystemPerformanceMetrics = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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
	const { isAdmin } = useUserRole();

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
