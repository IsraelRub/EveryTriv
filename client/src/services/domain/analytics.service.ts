import { AnalyticsResult, API_ENDPOINTS, ERROR_MESSAGES, LeaderboardPeriod, QUERY_PARAMS } from '@shared/constants';
import type {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
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
	QuestionData,
	SecurityMetrics,
	SystemInsights,
	SystemPerformanceMetrics,
	SystemRecommendation,
	TopicStatsData,
	TrackEventResponse,
	TrendQueryOptions,
	UserAnalyticsQuery,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { calculatePercentage, getErrorMessage, isNonEmptyString } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';
import type { CurrentGameStats } from '@/types';

class AnalyticsService {
	// ============================================================================
	// LOCAL CALCULATIONS
	// ============================================================================

	calculateGameSessionStats(questionsData: QuestionData[], totalScore: number, totalTime: number): CurrentGameStats {
		const correctAnswers = questionsData.filter(q => q.isCorrect).length;
		const totalQuestionsAnswered = questionsData.length;
		const successRate = calculatePercentage(correctAnswers, totalQuestionsAnswered);
		const timeSpentArray = questionsData.map(q => q.timeSpent).filter((t): t is number => t !== undefined && t > 0);
		const averageTimePerQuestion =
			timeSpentArray.length === 0
				? 0
				: Number((timeSpentArray.reduce((acc, val) => acc + val, 0) / timeSpentArray.length).toFixed(1));

		return {
			score: totalScore,
			correctAnswers,
			totalQuestionsAnswered,
			successRate,
			averageTimePerQuestion,
			totalTime,
			questionsData,
		};
	}

	// ============================================================================
	// EVENT TRACKING
	// ============================================================================

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

	// ============================================================================
	// USER ANALYTICS (Current User)
	// ============================================================================

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

	// ============================================================================
	// USER ANALYTICS (Admin - By User ID)
	// ============================================================================

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

	async getUserProgressById(
		userId: string,
		params?: TrendQueryOptions
	): Promise<AnalyticsResponse<UserProgressAnalytics>> {
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

			logger.userInfo('Fetching user progress by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserProgressAnalytics>>(
				`${API_ENDPOINTS.ANALYTICS.USER_PROGRESS.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User progress fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user progress', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	async getUserActivityById(
		userId: string,
		limit?: number,
		startDate?: Date | string,
		endDate?: Date | string
	): Promise<AnalyticsResponse<ActivityEntry[]>> {
		try {
			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			if (startDate) searchParams.append('startDate', startDate instanceof Date ? startDate.toISOString() : startDate);
			if (endDate) searchParams.append('endDate', endDate instanceof Date ? endDate.toISOString() : endDate);
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching user activity by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<ActivityEntry[]>>(
				`${API_ENDPOINTS.ANALYTICS.USER_ACTIVITY.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User activity fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user activity', { errorInfo: { message: getErrorMessage(error) }, userId });
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

	async getUserAchievementsById(userId: string): Promise<AnalyticsResponse<Achievement[]>> {
		try {
			logger.userInfo('Fetching user achievements by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<Achievement[]>>(
				API_ENDPOINTS.ANALYTICS.USER_ACHIEVEMENTS.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User achievements fetched successfully', {
				userId,
				count: result.data?.length ?? 0,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to get user achievements', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	async getUserTrendsById(userId: string, params?: TrendQueryOptions): Promise<AnalyticsResponse<UserTrendPoint[]>> {
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

			logger.userInfo('Fetching user trends by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserTrendPoint[]>>(
				`${API_ENDPOINTS.ANALYTICS.USER_TRENDS.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User trends fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user trends', { errorInfo: { message: getErrorMessage(error) }, userId });
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
				`${API_ENDPOINTS.ANALYTICS.USER_COMPARISON.replace(':userId', userId)}${query}`
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
				`${API_ENDPOINTS.ANALYTICS.USER_SUMMARY.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User summary fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user summary', { errorInfo: { message: getErrorMessage(error) }, userId });
			throw error;
		}
	}

	// ============================================================================
	// GLOBAL ANALYTICS
	// ============================================================================

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
				`${API_ENDPOINTS.ANALYTICS.TOPICS_POPULAR}${queryString}`
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
				`${API_ENDPOINTS.ANALYTICS.GLOBAL_TRENDS}${query}`
			);
			const result = response.data;
			logger.userInfo('Global trends fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global trends', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	// ============================================================================
	// BUSINESS ANALYTICS (Admin only)
	// ============================================================================

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

	// ============================================================================
	// SYSTEM ANALYTICS (Admin only)
	// ============================================================================

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

	// ============================================================================
	// LEADERBOARD
	// ============================================================================

	async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
		try {
			logger.userInfo('Fetching global leaderboard', { limit, offset });
			const query = new URLSearchParams();
			if (limit != null) query.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) query.append(QUERY_PARAMS.OFFSET, String(offset));
			const queryString = query.toString() ? `?${query.toString()}` : '';

			const response = await apiService.get<LeaderboardResponse>(
				`${API_ENDPOINTS.ANALYTICS.LEADERBOARD.GLOBAL}${queryString}`
			);
			const result = response.data.leaderboard;

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
				`${API_ENDPOINTS.ANALYTICS.LEADERBOARD.PERIOD.replace(':period', period)}${queryString}`
			);
			const result = response.data.leaderboard;

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
			const response = await apiService.get<LeaderboardStats>(`${API_ENDPOINTS.ANALYTICS.LEADERBOARD.STATS}${query}`);
			return response.data;
		} catch (error) {
			logger.gameError('Failed to get leaderboard stats', { errorInfo: { message: getErrorMessage(error) }, period });
			throw error;
		}
	}

	// ============================================================================
	// ADMIN OPERATIONS
	// ============================================================================

	async clearAllUserStats(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all user stats');
			const response = await apiService.delete<ClearOperationResponse>(API_ENDPOINTS.ANALYTICS.ADMIN_STATS_CLEAR_ALL);
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
}

export const analyticsService = new AnalyticsService();
