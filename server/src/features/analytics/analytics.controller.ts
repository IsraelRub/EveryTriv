import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Query,
} from '@nestjs/common';

import {
	API_ENDPOINTS,
	ComparisonTarget,
	ErrorCode,
	LeaderboardPeriod,
	TIME_DURATIONS_SECONDS,
	UserRole,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { AnalyticsEventData, LeaderboardEntry, LeaderboardResponse } from '@shared/types';
import { getErrorMessage, hasProperty, isRecord } from '@shared/utils';
import { isLeaderboardPeriod } from '@shared/validation';

import { Cache, CurrentUser, CurrentUserId, Public, Roles } from '@common/decorators';
import { LEADERBOARD_PERIOD_CONFIG, LEADERBOARD_SCORE_FIELDS } from '@internal/constants';
import { UserStatsEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import { getAvatarUrlForUser } from '@internal/utils';

import {
	GetLeaderboardDto,
	GetLeaderboardStatsDto,
	TopicAnalyticsQueryDto,
	TrackEventDto,
	UnifiedUserAnalyticsQueryDto,
	UserComparisonQueryDto,
	UserIdParamDto,
	UserSummaryQueryDto,
	UserTrendQueryDto,
} from './dtos';
import {
	AnalyticsTrackerService,
	BusinessAnalyticsService,
	GlobalAnalyticsService,
	LeaderboardAnalyticsService,
	SystemAnalyticsService,
	UserAnalyticsService,
} from './services';

function toLogRecord(obj: object | null | undefined): Record<string, unknown> {
	if (obj == null) return {};
	return Object.fromEntries(Object.entries(obj).map(([k, v]): [string, unknown] => [k, v]));
}

function getScoreFromUserStats(entry: UserStatsEntity, scoreField: string): number {
	if (scoreField === LEADERBOARD_SCORE_FIELDS.WEEKLY) return entry.weeklyScore ?? 0;
	if (scoreField === LEADERBOARD_SCORE_FIELDS.MONTHLY) return entry.monthlyScore ?? 0;
	if (scoreField === LEADERBOARD_SCORE_FIELDS.YEARLY) return entry.yearlyScore ?? 0;
	return 0;
}

@Controller(API_ENDPOINTS.ANALYTICS.BASE)
export class AnalyticsController {
	constructor(
		private readonly userAnalyticsService: UserAnalyticsService,
		private readonly globalAnalyticsService: GlobalAnalyticsService,
		private readonly businessAnalyticsService: BusinessAnalyticsService,
		private readonly systemAnalyticsService: SystemAnalyticsService,
		private readonly analyticsTrackerService: AnalyticsTrackerService,
		private readonly leaderboardAnalyticsService: LeaderboardAnalyticsService
	) {}

	@Post('track')
	async trackEvent(@Body() eventData: TrackEventDto) {
		try {
			if (!eventData.eventType) {
				throw new HttpException(ErrorCode.EVENT_TYPE_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const analyticsEventData: AnalyticsEventData = {
				...eventData,
				timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
			};

			const result = await this.analyticsTrackerService.trackEvent(analyticsEventData);

			logger.apiCreate('analytics_event_track', {
				id: result.eventId,
				eventType: eventData.eventType,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error tracking analytics event', {
				errorInfo: { message: getErrorMessage(error) },
				eventType: eventData.eventType,
			});
			throw error;
		}
	}

	@Get('user')
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getAuthenticatedUserAnalytics(@CurrentUserId() userId: string) {
		try {
			const result = await this.userAnalyticsService.getUserAnalytics(userId);

			logger.apiRead('analytics_user', {
				userId,
				chart: 'analytics_user',
				gameRecord: toLogRecord(result?.game ?? {}),
				metrics: toLogRecord(result?.performance ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user analytics', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	@Get('user/comparison/:userId')
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserComparison(
		@Param() params: UserIdParamDto,
		@Query() query: UserComparisonQueryDto,
		@CurrentUserId() currentUserId: string,
		@CurrentUser() user: { sub?: string; role?: string }
	) {
		if (params.userId !== currentUserId && user?.role !== UserRole.ADMIN) {
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['comparison'], {
				comparisonTarget: query.target ?? ComparisonTarget.GLOBAL,
				targetUserId: query.targetUserId,
				startDate: query.startDate,
				endDate: query.endDate,
				getGameStats: () => this.globalAnalyticsService.getGameStatsForComparison(),
			});
			return {
				data: result.data?.comparison ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user comparison', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	@Get('user/unified')
	async getCurrentUserUnifiedAnalytics(@CurrentUserId() userId: string, @Query() query: UnifiedUserAnalyticsQueryDto) {
		return this.fetchUnifiedUserAnalytics(userId, query);
	}

	@Get('user/unified/:userId')
	@Roles(UserRole.ADMIN)
	async getUnifiedUserAnalytics(@Param() params: UserIdParamDto, @Query() query: UnifiedUserAnalyticsQueryDto) {
		return this.fetchUnifiedUserAnalytics(params.userId, query);
	}

	@Get('user/summary/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserSummary(@Param() params: UserIdParamDto, @Query() query: UserSummaryQueryDto) {
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['summary'], {
				includeActivity: query.includeActivity ?? false,
			});
			logger.apiRead('analytics_user_summary', { userId: params.userId });
			return {
				data: result.data?.summary ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user summary', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	@Get('user/statistics/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserStatistics(@Param() params: UserIdParamDto) {
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['statistics']);
			logger.apiRead('analytics_user_statistics', { userId: params.userId });
			return {
				data: result.data?.statistics ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user statistics', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	@Get('user/performance/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserPerformance(@Param() params: UserIdParamDto) {
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['performance']);
			logger.apiRead('analytics_user_performance', { userId: params.userId });
			return {
				data: result.data?.performance ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user performance', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	@Get('user/insights/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserInsights(@Param() params: UserIdParamDto) {
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['insights']);
			logger.apiRead('analytics_user_insights', { userId: params.userId });
			return {
				data: result.data?.insights ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user insights', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	@Get('user/recommendations/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserRecommendations(@Param() params: UserIdParamDto) {
		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, ['recommendations']);
			logger.apiRead('analytics_user_recommendations', { userId: params.userId });
			return {
				data: result.data?.recommendations ?? null,
				timestamp: result.timestamp ?? new Date().toISOString(),
			};
		} catch (error) {
			logger.analyticsError('Error getting user recommendations', {
				errorInfo: { message: getErrorMessage(error) },
				userId: params.userId,
			});
			throw error;
		}
	}

	private async fetchUnifiedUserAnalytics(
		userId: string,
		query: UnifiedUserAnalyticsQueryDto
	): Promise<Awaited<ReturnType<UserAnalyticsService['getUnifiedUserAnalytics']>>> {
		const includeSections = query.include
			? query.include.split(',').map(s => s.trim().toLowerCase())
			: ['statistics', 'performance'];

		const targetUserId = query.targetUserId?.trim() ?? undefined;
		const comparisonTarget = query.comparisonTarget ?? undefined;

		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(userId, includeSections, {
				startDate: query.startDate,
				endDate: query.endDate,
				groupBy: query.groupBy,
				activityLimit: query.activityLimit,
				trendLimit: query.trendLimit,
				includeActivity: query.includeActivity,
				targetUserId,
				comparisonTarget,
				getGameStats: () => this.globalAnalyticsService.getGameStatsForComparison(),
			});

			logger.apiRead(`analytics_user_unified [${includeSections.length} sections: ${includeSections.join(',')}]`, {
				userId,
				query: Object.keys(query ?? {}),
				chart: 'analytics_user_unified',
				dataKeys: result?.data ? Object.keys(result.data) : [],
				metrics: result?.data ? toLogRecord(result.data) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError(
				`Error getting unified user analytics [${includeSections.length} sections: ${includeSections.join(',')}]`,
				{
					errorInfo: { message: getErrorMessage(error) },
					userId,
					query: Object.keys(query ?? {}),
				}
			);
			throw error;
		}
	}

	// Global analytics endpoints

	@Get('global/topics/popular')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getPopularTopics(@Query() query: TopicAnalyticsQueryDto) {
		try {
			const result = await this.globalAnalyticsService.getTopicStats(query);

			const topicsData = result?.data?.topics;
			const topicsArray = Array.isArray(topicsData) ? topicsData : [];
			const topicNames: string[] = [];
			const topicsByCount: Record<string, number> = {};
			for (const t of topicsArray) {
				if (isRecord(t) && hasProperty(t, 'topic') && hasProperty(t, 'totalGames')) {
					const topic = String(t.topic ?? '');
					const totalGames = typeof t.totalGames === 'number' ? t.totalGames : Number(t.totalGames) || 0;
					if (topic) topicNames.push(topic);
					topicsByCount[topic || 'unknown'] = totalGames;
				}
			}
			logger.apiRead('analytics_popular_topics', {
				query: Object.keys(query),
				totalTopics: result?.data?.totalTopics ?? 0,
				topicNames,
				topicsByCount,
				topics: topicsArray.length > 0 ? topicsArray : Array.isArray(topicsData) ? topicsData : [],
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting popular topics', {
				errorInfo: { message: getErrorMessage(error) },
				query: Object.keys(query),
			});
			throw error;
		}
	}

	@Get('global/difficulty')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getGlobalDifficultyStats() {
		try {
			const result = await this.globalAnalyticsService.getGlobalDifficultyStats();

			logger.apiRead('analytics_global_difficulty_stats', {
				chart: 'global_difficulty',
				difficultyBreakdown: result ? toLogRecord(result) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global difficulty stats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('global/stats')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getGlobalStats() {
		try {
			const result = await this.globalAnalyticsService.getGlobalStats();

			logger.apiRead('analytics_global_stats', {
				chart: 'global_stats',
				successRate: result?.successRate,
				averageGames: result?.averageGames,
				consistency: result?.consistency,
				averageGameTime: result?.averageGameTime,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global stats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('global/trends')
	@Roles(UserRole.ADMIN)
	async getGlobalTrends(@Query() query: UserTrendQueryDto) {
		try {
			const result = await this.globalAnalyticsService.getGlobalTrends(query);

			const trendPoints = result?.data ?? [];
			logger.apiRead('analytics_global_trends', {
				query: Object.keys(query ?? {}),
				chart: 'global_trends',
				pointsCount: Array.isArray(trendPoints) ? trendPoints.length : 0,
				trends: Array.isArray(trendPoints) ? trendPoints.slice(0, 10) : [],
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global trends', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// Business analytics endpoints

	@Get('business/metrics')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getBusinessMetrics() {
		try {
			const result = await this.businessAnalyticsService.getBusinessMetrics();

			logger.apiRead('analytics_business_metrics', {
				chart: 'business_metrics',
				metrics: result ? toLogRecord(result) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting business metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// System analytics endpoints

	@Get('system/performance')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getSystemPerformanceMetrics() {
		try {
			const result = await this.systemAnalyticsService.getPerformanceMetrics();

			logger.apiRead('analytics_system_performance', {
				chart: 'system_performance',
				metrics: result ? toLogRecord(result) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting system performance metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('system/security')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getSystemSecurityMetrics() {
		try {
			const result = this.systemAnalyticsService.securityMetrics;

			logger.apiRead('analytics_system_security', {
				chart: 'system_security',
				metrics: result ? toLogRecord(result) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting system security metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('system/recommendations')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getSystemRecommendations() {
		try {
			const result = await this.systemAnalyticsService.getSystemRecommendations();

			logger.apiRead('analytics_system_recommendations', {
				recommendationsCount: result.length,
				chart: 'system_recommendations',
				count: Array.isArray(result) ? result.length : 0,
				recommendations: Array.isArray(result) ? result : [],
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting system recommendations', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('system/insights')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getSystemInsights() {
		try {
			const result = this.systemAnalyticsService.getSystemInsights();

			logger.apiRead('analytics_system_insights', {
				status: result.status,
				chart: 'system_insights',
				insights: result ? toLogRecord(result) : {},
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting system insights', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// Leaderboard endpoints

	@Get('leaderboard/global')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit;
			const offsetNum = query.offset;

			if (limitNum > VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX) {
				throw new HttpException(ErrorCode.LIMIT_CANNOT_EXCEED_1000, HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardAnalyticsService.getGlobalLeaderboard({
				limit: limitNum,
				offset: offsetNum,
			});
			const totalCount = await this.leaderboardAnalyticsService.getGlobalLeaderboardTotalCount();

			const globalScoreField = LEADERBOARD_PERIOD_CONFIG[LeaderboardPeriod.GLOBAL].scoreField;
			const topScores = leaderboard.slice(0, 5).map((e, i) => ({
				rank: i + offsetNum + 1,
				score: getScoreFromUserStats(e, globalScoreField),
				totalGames: e.totalGames ?? 0,
			}));
			logger.apiRead('leaderboard_global', {
				limit: limitNum,
				offset: offsetNum,
				resultsCount: leaderboard.length,
				chart: 'leaderboard_global',
				totalReturned: leaderboard.length,
				topScores,
			});

			const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
				userId: entry.userId,
				email: entry.user?.email ?? '',
				firstName: entry.user?.firstName,
				lastName: entry.user?.lastName,
				avatar: entry.user?.preferences?.avatar,
				avatarUrl: getAvatarUrlForUser(entry.user),
				rank: index + offsetNum + 1,
				score: getScoreFromUserStats(entry, globalScoreField),
				averageScore: entry.overallSuccessRate ?? 0,
				bestScore: entry.bestGameScore ?? 0,
				gamesPlayed: entry.totalGames ?? 0,
				lastPlayed: entry.lastPlayDate ?? entry.createdAt,
				successRate: entry.overallSuccessRate ?? 0,
				totalGames: entry.totalGames ?? 0,
				totalQuestionsAnswered: entry.totalQuestionsAnswered ?? 0,
				totalPlayTime: entry.totalPlayTime ?? 0,
			}));

			return {
				leaderboard: leaderboardEntries,
				pagination: {
					limit: limitNum,
					offset: offsetNum,
					total: totalCount,
					hasMore: offsetNum + leaderboardEntries.length < totalCount,
				},
			};
		} catch (error) {
			logger.userError('Error getting global leaderboard', {
				errorInfo: { message: getErrorMessage(error) },
				limit: query.limit,
				offset: query.offset,
			});
			throw error;
		}
	}

	@Get('leaderboard/period/:period')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getLeaderboardByPeriod(@Param('period') periodParam: string, @Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit;
			const periodInput = periodParam ?? query.type ?? LeaderboardPeriod.WEEKLY;

			if (!isLeaderboardPeriod(periodInput)) {
				throw new HttpException(ErrorCode.INVALID_PERIOD, HttpStatus.BAD_REQUEST);
			}

			const period: LeaderboardPeriod = periodInput;

			if (limitNum > VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX) {
				throw new HttpException(ErrorCode.LIMIT_CANNOT_EXCEED_1000, HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardAnalyticsService.getLeaderboardByPeriod({
				period,
				limit: limitNum,
			});

			const scoreField = LEADERBOARD_PERIOD_CONFIG[period].scoreField;
			const topPeriodScores = leaderboard.slice(0, 5).map((e, i) => ({
				rank: i + 1,
				score: getScoreFromUserStats(e, scoreField),
			}));
			logger.apiRead('leaderboard_period', {
				period,
				limit: limitNum,
				resultsCount: leaderboard.length,
				chart: 'leaderboard_period',
				totalReturned: leaderboard.length,
				topScores: topPeriodScores,
			});

			const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
				userId: entry.userId,
				email: entry.user?.email ?? '',
				firstName: entry.user?.firstName,
				lastName: entry.user?.lastName,
				avatar: entry.user?.preferences?.avatar,
				avatarUrl: getAvatarUrlForUser(entry.user),
				rank: index + 1,
				score: getScoreFromUserStats(entry, scoreField),
				averageScore: entry.overallSuccessRate ?? 0,
				bestScore: entry.bestGameScore ?? 0,
				gamesPlayed: entry.totalGames ?? 0,
				lastPlayed: entry.lastPlayDate ?? entry.createdAt,
				successRate: entry.overallSuccessRate ?? 0,
				totalGames: entry.totalGames ?? 0,
				totalQuestionsAnswered: entry.totalQuestionsAnswered ?? 0,
				totalPlayTime: entry.totalPlayTime ?? 0,
			}));

			const response: LeaderboardResponse = {
				leaderboard: leaderboardEntries,
				pagination: {
					limit: limitNum,
					offset: 0,
					total: leaderboard.length,
					hasMore: leaderboardEntries.length < leaderboard.length,
				},
				period,
			};
			return response;
		} catch (error) {
			logger.userError('Error getting period leaderboard', {
				errorInfo: { message: getErrorMessage(error) },
				period: periodParam ?? query.type ?? 'weekly',
				limit: query.limit,
			});
			throw error;
		}
	}

	@Get('leaderboard/stats')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getLeaderboardStats(@Query() query: GetLeaderboardStatsDto) {
		try {
			const periodInput = query.period;

			if (!periodInput || !isLeaderboardPeriod(periodInput)) {
				throw new HttpException(ErrorCode.INVALID_PERIOD, HttpStatus.BAD_REQUEST);
			}

			const period: LeaderboardPeriod = periodInput;
			const stats = await this.leaderboardAnalyticsService.getLeaderboardStats(period);

			logger.apiRead('leaderboard_stats', {
				period,
				activeUsers: stats.activeUsers,
				averageScore: stats.averageScore,
				averageGames: stats.averageGames,
				chart: 'leaderboard_stats',
			});

			return stats;
		} catch (error) {
			logger.userError('Error getting leaderboard stats', {
				errorInfo: { message: getErrorMessage(error) },
				period: query.period,
			});
			throw error;
		}
	}
}
