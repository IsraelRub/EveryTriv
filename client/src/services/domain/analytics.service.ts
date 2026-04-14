import {
	AnalyticsResult,
	API_ENDPOINTS,
	ERROR_MESSAGES,
	LeaderboardPeriod,
	QUERY_PARAMS,
	TimePeriod,
} from '@shared/constants';
import type {
	AnalyticsResponse,
	AnswerHistory,
	BasicValue,
	BusinessMetrics,
	ClearOperationResponse,
	ComparisonQueryOptions,
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	LeaderboardEntry,
	LeaderboardResponse,
	LeaderboardStats,
	SecurityMetrics,
	SystemInsights,
	SystemPerformanceMetrics,
	SystemRecommendation,
	TopicStatsData,
	TrackEventResponse,
	TrendQueryOptions,
	UnifiedUserAnalyticsResponse,
	UserAnalyticsQuery,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { calculateScoreRate, getErrorMessage, isNonEmptyString, mean } from '@shared/utils';

import type { AdminSystemHealthDashboardBundle, CheckAllUsersConsistencyResponse, CurrentGameStats } from '@/types';
import { apiService, clientLogger as logger } from '@/services';

class AnalyticsService {
	// Local calculations
	calculateGameSessionStats(answerHistory: AnswerHistory[], totalScore: number, totalTime: number): CurrentGameStats {
		const correctAnswers = answerHistory.filter(q => q.isCorrect).length;
		const totalQuestionsAnswered = answerHistory.length;
		const successRate = calculateScoreRate(totalScore, totalQuestionsAnswered);
		const timeSpentArray = answerHistory.map(q => q.timeSpent).filter((t): t is number => t !== undefined && t > 0);
		const averageTimePerQuestion = Number(mean(timeSpentArray).toFixed(1));

		return {
			score: totalScore,
			correctAnswers,
			totalQuestionsAnswered,
			successRate,
			averageTimePerQuestion,
			totalTime,
			answerHistory,
		};
	}

	// Event tracking
	async trackAnalyticsEvent(eventData: {
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
	}): Promise<TrackEventResponse> {
		// Validate event data
		if (!eventData || !isNonEmptyString(eventData.eventType)) {
			throw new Error(ERROR_MESSAGES.validation.EVENT_TYPE_REQUIRED);
		}

		try {
			const response = await apiService.post<TrackEventResponse>(API_ENDPOINTS.ANALYTICS.TRACK, eventData);
			return response.data;
		} catch (error) {
			logger.userError('Failed to track analytics event', {
				errorInfo: { message: getErrorMessage(error) },
				eventType: eventData.eventType,
			});
			throw error;
		}
	}

	// User analytics (current user)
	async getUserAnalytics(): Promise<CompleteUserAnalytics> {
		try {
			logger.userInfo('Fetching user analytics');
			const response = await apiService.get<CompleteUserAnalytics>(API_ENDPOINTS.ANALYTICS.USER);
			const result = response.data;
			logger.userInfo('User analytics fetched successfully', { userId: result.basic?.userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user analytics', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getUnifiedUserAnalytics(includeSections?: string[]): Promise<AnalyticsResponse<UnifiedUserAnalyticsResponse>> {
		const sectionsCount = includeSections?.length ?? 0;
		try {
			const searchParams = new URLSearchParams();
			if (includeSections && includeSections.length > 0) {
				searchParams.append('include', includeSections.join(','));
				if (includeSections.map(s => s.toLowerCase()).includes('trends')) {
					searchParams.append('groupBy', TimePeriod.DAILY);
					searchParams.append('trendLimit', '30');
				}
			}
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching unified user analytics', {
				sectionsCount,
			});
			const response = await apiService.get<AnalyticsResponse<UnifiedUserAnalyticsResponse>>(
				`${API_ENDPOINTS.ANALYTICS.USER}/unified${query}`
			);
			const result = response.data;
			logger.userInfo('Unified user analytics fetched successfully', {
				sectionsCount,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to get unified user analytics', {
				errorInfo: { message: getErrorMessage(error) },
				sectionsCount,
			});
			throw error;
		}
	}

	async getUnifiedUserAnalyticsByUserId(
		userId: string,
		includeSections: string[]
	): Promise<AnalyticsResponse<UnifiedUserAnalyticsResponse>> {
		try {
			const searchParams = new URLSearchParams();
			if (includeSections.length > 0) {
				searchParams.append('include', includeSections.join(','));
				if (includeSections.map(s => s.toLowerCase()).includes('trends')) {
					searchParams.append('groupBy', TimePeriod.DAILY);
					searchParams.append('trendLimit', '30');
				}
			}
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching unified user analytics by ID', { userId, sectionsCount: includeSections.length });
			const response = await apiService.get<AnalyticsResponse<UnifiedUserAnalyticsResponse>>(
				`${API_ENDPOINTS.ANALYTICS.USER}/unified/${userId}` + query
			);
			const result = response.data;
			logger.userInfo('Unified user analytics by ID fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get unified user analytics by ID', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	// User analytics (admin, by user ID)
	async getUserStatisticsById(userId: string): Promise<AnalyticsResponse<UserAnalyticsRecord>> {
		try {
			logger.userInfo('Fetching user statistics by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserAnalyticsRecord>>(
				API_ENDPOINTS.ANALYTICS.USER_STATS.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User statistics fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user statistics', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	async getUserPerformanceById(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>> {
		try {
			logger.userInfo('Fetching user performance by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserPerformanceMetrics>>(
				API_ENDPOINTS.ANALYTICS.USER_PERFORMANCE.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User performance fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user performance', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	async getUserInsightsById(userId: string): Promise<AnalyticsResponse<UserInsightsData>> {
		try {
			logger.userInfo('Fetching user insights by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserInsightsData>>(
				API_ENDPOINTS.ANALYTICS.USER_INSIGHTS.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User insights fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user insights', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	async getUserRecommendationsById(userId: string): Promise<AnalyticsResponse<SystemRecommendation[]>> {
		try {
			logger.userInfo('Fetching user recommendations by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<SystemRecommendation[]>>(
				API_ENDPOINTS.ANALYTICS.USER_RECOMMENDATIONS.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User recommendations fetched successfully', {
				userId,
				count: result.data?.length ?? 0,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to get user recommendations', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async compareUserPerformanceById(
		userId: string,
		params?: ComparisonQueryOptions
	): Promise<AnalyticsResponse<UserComparisonResult>> {
		try {
			const searchParams = new URLSearchParams();
			if (params?.target) searchParams.append('target', params.target);
			if (params?.targetUserId) searchParams.append('targetUserId', params.targetUserId);
			if (params?.startDate)
				searchParams.append(
					'startDate',
					params.startDate instanceof Date ? params.startDate.toISOString() : params.startDate
				);
			if (params?.endDate)
				searchParams.append('endDate', params.endDate instanceof Date ? params.endDate.toISOString() : params.endDate);
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching user comparison by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserComparisonResult>>(
				API_ENDPOINTS.ANALYTICS.USER_COMPARISON.replace(':userId', userId) + query
			);
			const result = response.data;
			logger.userInfo('User comparison fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to compare user performance', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getUserSummaryById(
		userId: string,
		includeActivity: boolean = false
	): Promise<AnalyticsResponse<UserSummaryData>> {
		try {
			const searchParams = new URLSearchParams();
			if (includeActivity) searchParams.append('includeActivity', 'true');
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching user summary by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserSummaryData>>(
				API_ENDPOINTS.ANALYTICS.USER_SUMMARY.replace(':userId', userId) + query
			);
			const result = response.data;
			logger.userInfo('User summary fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user summary', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	// Global analytics
	async getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData> {
		try {
			const searchParams = new URLSearchParams();
			if (query?.startDate)
				searchParams.append(
					'startDate',
					query.startDate instanceof Date ? query.startDate.toISOString() : query.startDate
				);
			if (query?.endDate)
				searchParams.append('endDate', query.endDate instanceof Date ? query.endDate.toISOString() : query.endDate);
			if (query?.includeGameHistory != null)
				searchParams.append('includeGameHistory', String(query.includeGameHistory));
			if (query?.includePerformance != null)
				searchParams.append('includePerformance', String(query.includePerformance));
			if (query?.includeTopicBreakdown != null)
				searchParams.append('includeTopicBreakdown', String(query.includeTopicBreakdown));
			const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching popular topics', { query: query ? JSON.stringify(query) : undefined });
			const response = await apiService.get<AnalyticsResponse<TopicStatsData>>(
				API_ENDPOINTS.ANALYTICS.TOPICS_POPULAR + queryString
			);
			const result = response.data.data;
			logger.userInfo('Popular topics fetched successfully', { totalTopics: result.topics.length });
			return result;
		} catch (error) {
			logger.userError('Failed to get popular topics', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getGlobalDifficultyStats(): Promise<DifficultyBreakdown> {
		try {
			logger.userInfo('Fetching global difficulty stats');
			const response = await apiService.get<DifficultyBreakdown>(API_ENDPOINTS.ANALYTICS.DIFFICULTY_GLOBAL);
			const result = response.data;
			logger.userInfo('Global difficulty stats fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global difficulty stats', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getGlobalStats(): Promise<GlobalStatsResponse> {
		try {
			logger.userInfo('Fetching real-time analytics');
			const response = await apiService.get<GlobalStatsResponse>(API_ENDPOINTS.ANALYTICS.GLOBAL_STATS);
			const result = response.data;
			logger.userInfo('Real-time analytics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global stats', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getGlobalTrends(params?: TrendQueryOptions): Promise<AnalyticsResponse<UserTrendPoint[]>> {
		try {
			const searchParams = new URLSearchParams();
			if (params?.startDate)
				searchParams.append(
					'startDate',
					params.startDate instanceof Date ? params.startDate.toISOString() : params.startDate
				);
			if (params?.endDate)
				searchParams.append('endDate', params.endDate instanceof Date ? params.endDate.toISOString() : params.endDate);
			if (params?.groupBy) searchParams.append('groupBy', params.groupBy);
			if (params?.limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(params.limit));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching global trends', params ? { query: JSON.stringify(params) } : undefined);
			const response = await apiService.get<AnalyticsResponse<UserTrendPoint[]>>(
				API_ENDPOINTS.ANALYTICS.GLOBAL_TRENDS + query
			);
			const result = response.data;
			logger.userInfo('Global trends fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global trends', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	// Business analytics (admin only)
	async getBusinessMetrics(): Promise<BusinessMetrics> {
		try {
			logger.userInfo('Fetching business metrics');
			const response = await apiService.get<BusinessMetrics>(API_ENDPOINTS.ANALYTICS.BUSINESS_METRICS);
			const result = response.data;
			logger.userInfo('Business metrics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get business metrics', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	// System analytics (admin only)
	async getSystemPerformanceMetrics(): Promise<SystemPerformanceMetrics> {
		try {
			logger.userInfo('Fetching system performance metrics');
			const response = await apiService.get<SystemPerformanceMetrics>(API_ENDPOINTS.ANALYTICS.SYSTEM_PERFORMANCE);
			const result = response.data;
			logger.userInfo('System performance metrics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get system performance metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getSystemSecurityMetrics(): Promise<SecurityMetrics> {
		try {
			logger.userInfo('Fetching system security metrics');
			const response = await apiService.get<SecurityMetrics>(API_ENDPOINTS.ANALYTICS.SYSTEM_SECURITY);
			const result = response.data;
			logger.userInfo('System security metrics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get system security metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getSystemRecommendations(): Promise<SystemRecommendation[]> {
		try {
			logger.userInfo('Fetching system recommendations');
			const response = await apiService.get<SystemRecommendation[]>(API_ENDPOINTS.ANALYTICS.SYSTEM_RECOMMENDATIONS);
			const result = response.data;
			logger.userInfo('System recommendations fetched successfully', {
				count: result.length,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to get system recommendations', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getSystemInsights(): Promise<SystemInsights> {
		try {
			logger.userInfo('Fetching system insights');
			const response = await apiService.get<SystemInsights>(API_ENDPOINTS.ANALYTICS.SYSTEM_INSIGHTS);
			const result = response.data;
			logger.userInfo('System insights fetched successfully', { status: result.status });
			return result;
		} catch (error) {
			logger.userError('Failed to get system insights', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async getAdminSystemHealthDashboard(): Promise<AdminSystemHealthDashboardBundle> {
		try {
			logger.userInfo('Fetching bundled admin system health dashboard');
			const [performance, security, recommendations, insights] = await Promise.all([
				this.getSystemPerformanceMetrics(),
				this.getSystemSecurityMetrics(),
				this.getSystemRecommendations(),
				this.getSystemInsights(),
			]);
			const bundle: AdminSystemHealthDashboardBundle = { performance, security, recommendations, insights };
			logger.userInfo('Admin system health dashboard loaded');
			return bundle;
		} catch (error) {
			logger.userError('Failed to load admin system health dashboard', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// Leaderboard
	async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
		try {
			logger.userInfo('Fetching global leaderboard', { limit, offset });
			const query = new URLSearchParams();
			if (limit != null) query.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) query.append(QUERY_PARAMS.OFFSET, String(offset));
			const queryString = query.toString() ? `?${query.toString()}` : '';

			const response = await apiService.get<LeaderboardResponse>(
				API_ENDPOINTS.ANALYTICS.LEADERBOARD.GLOBAL + queryString
			);
			const result = AnalyticsService.deduplicateLeaderboardByUserId(response.data.leaderboard);

			logger.userInfo('Global leaderboard fetched successfully', { count: result.length });
			return result;
		} catch (error) {
			logger.gameError('Failed to get global leaderboard', {
				errorInfo: { message: getErrorMessage(error) },
				limit,
				offset,
			});
			throw error;
		}
	}

	async getLeaderboardByPeriod(
		period: LeaderboardPeriod,
		limit: number = 100,
		offset: number = 0
	): Promise<LeaderboardEntry[]> {
		try {
			logger.userInfo('Fetching leaderboard by period', { period, limit, offset });
			const query = new URLSearchParams();
			if (limit != null) query.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) query.append(QUERY_PARAMS.OFFSET, String(offset));
			const queryString = query.toString() ? `?${query.toString()}` : '';

			const response = await apiService.get<LeaderboardResponse>(
				API_ENDPOINTS.ANALYTICS.LEADERBOARD.PERIOD.replace(':period', period) + queryString
			);
			const result = AnalyticsService.deduplicateLeaderboardByUserId(response.data.leaderboard);

			logger.userInfo('Leaderboard fetched successfully', { period, count: result.length });
			return result;
		} catch (error) {
			logger.gameError('Failed to get leaderboard by period', {
				errorInfo: { message: getErrorMessage(error) },
				period,
				limit,
				offset,
			});
			throw error;
		}
	}

	async getLeaderboardStats(period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY): Promise<LeaderboardStats> {
		try {
			const query = `?${QUERY_PARAMS.PERIOD}=${period}`;
			const response = await apiService.get<LeaderboardStats>(API_ENDPOINTS.ANALYTICS.LEADERBOARD.STATS + query);
			return response.data;
		} catch (error) {
			logger.gameError('Failed to get leaderboard stats', { errorInfo: { message: getErrorMessage(error) }, period });
			throw error;
		}
	}

	// Admin operations
	async clearAllUserStats(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all user stats');
			const response = await apiService.delete<ClearOperationResponse>(
				API_ENDPOINTS.MAINTENANCE.DATA_USER_STATS_CLEAR_ALL
			);
			const result = response.data;
			logger.userInfo('All user stats cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.userError('Failed to clear all user stats', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async clearAllLeaderboard(): Promise<ClearOperationResponse> {
		try {
			const response = await apiService.delete<ClearOperationResponse>(
				`${API_ENDPOINTS.ANALYTICS.LEADERBOARD.ADMIN_CLEAR_ALL}`
			);
			return response.data;
		} catch (error) {
			logger.gameError('Failed to clear all leaderboard data', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	// Maintenance operations
	async checkAllUsersConsistency(): Promise<CheckAllUsersConsistencyResponse> {
		try {
			logger.userInfo('Checking all users consistency');
			const response = await apiService.get<CheckAllUsersConsistencyResponse>(
				API_ENDPOINTS.MAINTENANCE.STATS_CONSISTENCY_CHECK_ALL
			);
			const result = response.data;
			logger.userInfo('All users consistency check completed', {
				totalUsers: result.totalUsers,
				consistentUsers: result.consistentUsers,
				inconsistentUsers: result.inconsistentUsers,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to check all users consistency', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async checkUserStatsConsistency(userId: string): Promise<{
		isConsistent: boolean;
		discrepancies: {
			totalGames: { expected: number; actual: number };
			totalQuestionsAnswered: { expected: number; actual: number };
			correctAnswers: { expected: number; actual: number };
			totalScore: { expected: number; actual: number };
			successRate: { expected: number; actual: number };
			bestGameScore: { expected: number; actual: number };
			lastPlayDate: { expected: Date | null; actual: Date | null };
			topicStats: { inconsistent: string[] };
			difficultyStats: { inconsistent: string[] };
		};
	}> {
		try {
			logger.userInfo('Checking user stats consistency', { userId });
			const url = API_ENDPOINTS.MAINTENANCE.STATS_CONSISTENCY.replace(':userId', userId);
			const response = await apiService.get<{
				isConsistent: boolean;
				discrepancies: {
					totalGames: { expected: number; actual: number };
					totalQuestionsAnswered: { expected: number; actual: number };
					correctAnswers: { expected: number; actual: number };
					totalScore: { expected: number; actual: number };
					successRate: { expected: number; actual: number };
					bestGameScore: { expected: number; actual: number };
					lastPlayDate: { expected: Date | null; actual: Date | null };
					topicStats: { inconsistent: string[] };
					difficultyStats: { inconsistent: string[] };
				};
			}>(url);
			const result = response.data;
			logger.userInfo('User stats consistency check completed', { userId, isConsistent: result.isConsistent });
			return result;
		} catch (error) {
			logger.userError('Failed to check user stats consistency', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async fixUserStatsConsistency(userId: string): Promise<{ fixed: boolean; message: string }> {
		try {
			logger.userInfo('Fixing user stats consistency', { userId });
			const url = API_ENDPOINTS.MAINTENANCE.STATS_FIX_CONSISTENCY.replace(':userId', userId);
			const response = await apiService.post<{ fixed: boolean; message: string }>(url);
			const result = response.data;
			logger.userInfo('User stats consistency fix completed', { userId, fixed: result.fixed });
			return result;
		} catch (error) {
			logger.userError('Failed to fix user stats consistency', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	private static deduplicateLeaderboardByUserId(entries: LeaderboardEntry[]): LeaderboardEntry[] {
		const seen = new Set<string>();
		return entries.filter(entry => {
			if (seen.has(entry.userId)) return false;
			seen.add(entry.userId);
			return true;
		});
	}
}

export const analyticsService = new AnalyticsService();
