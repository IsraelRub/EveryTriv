/**
 * Client-side Analytics Service
 *
 * @module ClientAnalyticsService
 * @description Analytics service for calculating statistics from current game data and API analytics
 * @used_by client/src/views, client/src/components, client/src/hooks
 */

import { AnalyticsResult, API_ROUTES, ERROR_MESSAGES } from '@shared/constants';
import type {
	AnalyticsResponse,
	BasicValue,
	ClearOperationResponse,
	ComparisonQueryOptions,
	CompleteUserAnalytics,
	DifficultyBreakdown,
	GlobalStatsResponse,
	QuestionData,
	TopicStatsData,
	TrackEventResponse,
	TrendQueryOptions,
	UserAnalyticsQuery,
	UserComparisonResult,
	UserPerformanceMetrics,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { calculatePercentage, getErrorMessage, isNonEmptyString } from '@shared/utils';
import { apiService, clientLogger as logger } from '@/services';
import type { CurrentGameStats } from '@/types';
import { calculateAverage } from '@/utils';

/**
 * Client-side analytics service for local calculations and API analytics
 */
export class AnalyticsService {
	/**
	 * Calculate statistics from current game session
	 * @param questionsData Array of question data from current game
	 * @param totalScore Total score achieved
	 * @param totalTime Total time spent in seconds
	 * @returns Current game statistics
	 */
	calculateGameSessionStats(questionsData: QuestionData[], totalScore: number, totalTime: number): CurrentGameStats {
		const correctAnswers = questionsData.filter(q => q.isCorrect).length;
		const totalQuestionsAnswered = questionsData.length;
		const successRate = calculatePercentage(correctAnswers, totalQuestionsAnswered);
		const timeSpentArray = questionsData.map(q => q.timeSpent).filter((t): t is number => t !== undefined && t > 0);
		const averageTimePerQuestion = calculateAverage(timeSpentArray, 1);

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

	/**
	 * Get user analytics
	 * @returns Complete user analytics data
	 * @throws {Error} When retrieval fails
	 */
	async getUserAnalytics(): Promise<CompleteUserAnalytics> {
		try {
			logger.userInfo('Fetching user analytics');
			const response = await apiService.get<CompleteUserAnalytics>(API_ROUTES.ANALYTICS.USER);
			const result = response.data;
			logger.userInfo('User analytics fetched successfully', { userId: result.basic?.userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user analytics', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get popular topics
	 * @param query Optional query parameters
	 * @returns Popular topics statistics
	 * @throws {Error} When retrieval fails
	 */
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
				`${API_ROUTES.ANALYTICS.TOPICS_POPULAR}${queryString}`
			);
			const result = response.data.data;
			logger.userInfo('Popular topics fetched successfully', { totalTopics: result.topics.length });
			return result;
		} catch (error) {
			logger.userError('Failed to get popular topics', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get global difficulty statistics
	 * @returns Global difficulty statistics
	 * @throws {Error} When retrieval fails
	 */
	async getGlobalDifficultyStats(): Promise<DifficultyBreakdown> {
		try {
			logger.userInfo('Fetching global difficulty stats');
			const response = await apiService.get<DifficultyBreakdown>(API_ROUTES.ANALYTICS.DIFFICULTY_GLOBAL);
			const result = response.data;
			logger.userInfo('Global difficulty stats fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global difficulty stats', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get global statistics
	 * @returns Global statistics
	 * @throws {Error} When retrieval fails
	 */
	async getGlobalStats(): Promise<GlobalStatsResponse> {
		try {
			logger.userInfo('Fetching real-time analytics');
			const response = await apiService.get<GlobalStatsResponse>(API_ROUTES.ANALYTICS.GLOBAL_STATS);
			const result = response.data;
			logger.userInfo('Real-time analytics fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global stats', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get global trends (Admin only)
	 * @param params Optional trend query parameters
	 * @returns Global trend data
	 * @throws {Error} When retrieval fails
	 */
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
			if (params?.limit != null) searchParams.append('limit', String(params.limit));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching global trends', params ? { query: JSON.stringify(params) } : undefined);
			const response = await apiService.get<AnalyticsResponse<UserTrendPoint[]>>(
				`${API_ROUTES.ANALYTICS.GLOBAL_TRENDS}${query}`
			);
			const result = response.data;
			logger.userInfo('Global trends fetched successfully');
			return result;
		} catch (error) {
			logger.userError('Failed to get global trends', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Track analytics event
	 * @param eventData Event data to track
	 * @returns Tracking result
	 * @throws {Error} When tracking fails
	 */
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
			const response = await apiService.post<TrackEventResponse>(API_ROUTES.ANALYTICS.TRACK, eventData);
			return response.data;
		} catch (error) {
			logger.userError('Failed to track analytics event', {
				error: getErrorMessage(error),
				eventType: eventData.eventType,
			});
			throw error;
		}
	}

	/**
	 * Get user performance by ID (Admin only)
	 * @param userId User ID
	 * @returns User performance metrics
	 * @throws {Error} When retrieval fails
	 */
	async getUserPerformanceById(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>> {
		try {
			logger.userInfo('Fetching user performance by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserPerformanceMetrics>>(
				API_ROUTES.ANALYTICS.USER_PERFORMANCE.replace(':userId', userId)
			);
			const result = response.data;
			logger.userInfo('User performance fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user performance', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Get user trends by ID (Admin only)
	 * @param userId User ID
	 * @param params Optional trend query parameters
	 * @returns User trend data
	 * @throws {Error} When retrieval fails
	 */
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
			if (params?.limit != null) searchParams.append('limit', String(params.limit));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			logger.userInfo('Fetching user trends by ID', { userId });
			const response = await apiService.get<AnalyticsResponse<UserTrendPoint[]>>(
				`${API_ROUTES.ANALYTICS.USER_TRENDS.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User trends fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user trends', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Compare user performance by ID (Admin only)
	 * @param userId User ID
	 * @param params Optional comparison query parameters
	 * @returns User comparison result
	 * @throws {Error} When retrieval fails
	 */
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
				`${API_ROUTES.ANALYTICS.USER_COMPARISON.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User comparison fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to compare user performance', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Get user summary by ID (Admin only)
	 * @param userId User ID
	 * @param includeActivity Include activity data (default: false)
	 * @returns User summary data
	 * @throws {Error} When retrieval fails
	 */
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
				`${API_ROUTES.ANALYTICS.USER_SUMMARY.replace(':userId', userId)}${query}`
			);
			const result = response.data;
			logger.userInfo('User summary fetched successfully', { userId });
			return result;
		} catch (error) {
			logger.userError('Failed to get user summary', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Clear all user stats (Admin only)
	 * @returns Clear operation result
	 * @throws {Error} When operation fails
	 */
	async clearAllUserStats(): Promise<ClearOperationResponse> {
		try {
			logger.userInfo('Clearing all user stats');
			const response = await apiService.delete<ClearOperationResponse>(API_ROUTES.ANALYTICS.ADMIN_STATS_CLEAR_ALL);
			const result = response.data;
			logger.userInfo('All user stats cleared successfully', { deletedCount: result.deletedCount });
			return result;
		} catch (error) {
			logger.userError('Failed to clear all user stats', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

// Create singleton instance
export const analyticsService = new AnalyticsService();
