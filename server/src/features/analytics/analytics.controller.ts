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
	ERROR_CODES,
	LeaderboardPeriod,
	TIME_DURATIONS_SECONDS,
	UserRole,
	VALID_LEADERBOARD_PERIODS,
} from '@shared/constants';
import type { AnalyticsEventData, LeaderboardEntry, LeaderboardResponse } from '@shared/types';
import { calculateHasMore, getErrorMessage, isOneOf } from '@shared/utils';

import { UserStatsEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

import { Cache, CurrentUserId, CurrentUser, Public, Roles } from '../../common';
import {
	GetLeaderboardDto,
	GetLeaderboardStatsDto,
	TopicAnalyticsQueryDto,
	TrackEventDto,
	UnifiedUserAnalyticsQueryDto,
	UserIdParamDto,
	UserComparisonQueryDto,
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
				throw new HttpException(ERROR_CODES.EVENT_TYPE_REQUIRED, HttpStatus.BAD_REQUEST);
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
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
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

	// ==================== Unified User Analytics Endpoint ====================

	@Get('user/unified')
	async getCurrentUserUnifiedAnalytics(@CurrentUserId() userId: string, @Query() query: UnifiedUserAnalyticsQueryDto) {
		const includeSections = query.include
			? query.include.split(',').map(s => s.trim().toLowerCase())
			: ['statistics', 'performance'];

		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(userId, includeSections, {
				startDate: query.startDate,
				endDate: query.endDate,
				groupBy: query.groupBy,
				activityLimit: query.activityLimit,
				trendLimit: query.trendLimit,
				includeActivity: query.includeActivity,
				targetUserId: query.targetUserId,
				comparisonTarget: query.comparisonTarget,
				getGameStats: () => this.globalAnalyticsService.getGameStatsForComparison(),
			});

			logger.apiRead(`analytics_user_unified [${includeSections.length} sections: ${includeSections.join(',')}]`, {
				userId,
				query: Object.keys(query || {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError(
				`Error getting unified user analytics [${includeSections.length} sections: ${includeSections.join(',')}]`,
				{
					errorInfo: { message: getErrorMessage(error) },
					userId,
					query: Object.keys(query || {}),
				}
			);
			throw error;
		}
	}

	@Get('user/unified/:userId')
	@Roles(UserRole.ADMIN)
	async getUnifiedUserAnalytics(@Param() params: UserIdParamDto, @Query() query: UnifiedUserAnalyticsQueryDto) {
		const includeSections = query.include
			? query.include.split(',').map(s => s.trim().toLowerCase())
			: ['statistics', 'performance'];

		try {
			const result = await this.userAnalyticsService.getUnifiedUserAnalytics(params.userId, includeSections, {
				startDate: query.startDate,
				endDate: query.endDate,
				groupBy: query.groupBy,
				activityLimit: query.activityLimit,
				trendLimit: query.trendLimit,
				includeActivity: query.includeActivity,
				targetUserId: query.targetUserId,
				comparisonTarget: query.comparisonTarget,
				getGameStats: () => this.globalAnalyticsService.getGameStatsForComparison(),
			});

			logger.apiRead(`analytics_user_unified [${includeSections.length} sections: ${includeSections.join(',')}]`, {
				userId: params.userId,
				query: Object.keys(query || {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError(
				`Error getting unified user analytics [${includeSections.length} sections: ${includeSections.join(',')}]`,
				{
					errorInfo: { message: getErrorMessage(error) },
					userId: params.userId,
					query: Object.keys(query || {}),
				}
			);
			throw error;
		}
	}

	// ==================== Global Analytics Endpoints ====================

	@Get('global/topics/popular')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getPopularTopics(@Query() query: TopicAnalyticsQueryDto) {
		try {
			const result = await this.globalAnalyticsService.getTopicStats(query);

			logger.apiRead('analytics_popular_topics', {
				query: Object.keys(query),
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

			logger.apiRead('analytics_global_difficulty_stats', {});

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

			logger.apiRead('analytics_global_stats', {});

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

			logger.apiRead('analytics_global_trends', {
				query: Object.keys(query ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global trends', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// ==================== Business Analytics Endpoints ====================

	@Get('business/metrics')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getBusinessMetrics() {
		try {
			const result = await this.businessAnalyticsService.getBusinessMetrics();

			logger.apiRead('analytics_business_metrics', {});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting business metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// ==================== System Analytics Endpoints ====================

	@Get('system/performance')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getSystemPerformanceMetrics() {
		try {
			const result = await this.systemAnalyticsService.getPerformanceMetrics();

			logger.apiRead('analytics_system_performance', {});

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
			const result = await this.systemAnalyticsService.getSecurityMetrics();

			logger.apiRead('analytics_system_security', {});

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
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting system insights', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// ==================== Leaderboard Endpoints ====================

	@Get('leaderboard/global')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit;
			const offsetNum = query.offset;

			if (limitNum > 1000) {
				throw new HttpException(ERROR_CODES.LIMIT_CANNOT_EXCEED_1000, HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardAnalyticsService.getGlobalLeaderboard({
				limit: limitNum,
				offset: offsetNum,
			});

			logger.apiRead('leaderboard_global', {
				limit: limitNum,
				offset: offsetNum,
				resultsCount: leaderboard.length,
			});

			const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
				userId: entry.userId,
				email: entry.user?.email || '',
				firstName: entry.user?.firstName,
				lastName: entry.user?.lastName,
				avatar: entry.user?.preferences?.avatar,
				rank: index + offsetNum + 1,
				score: entry.weeklyScore,
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
					total: leaderboard.length,
					hasMore: calculateHasMore(offsetNum, leaderboardEntries.length, leaderboard.length),
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
			const periodString = periodParam || query.type || LeaderboardPeriod.WEEKLY;

			if (!isOneOf(VALID_LEADERBOARD_PERIODS)(periodString)) {
				throw new HttpException(ERROR_CODES.INVALID_PERIOD, HttpStatus.BAD_REQUEST);
			}

			if (limitNum > 1000) {
				throw new HttpException(ERROR_CODES.LIMIT_CANNOT_EXCEED_1000, HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardAnalyticsService.getLeaderboardByPeriod({
				period: periodString,
				limit: limitNum,
			});

			logger.apiRead('leaderboard_period', {
				period: periodString,
				limit: limitNum,
				resultsCount: leaderboard.length,
			});

			const scoreFieldMap: Record<LeaderboardPeriod, keyof UserStatsEntity> = {
				[LeaderboardPeriod.WEEKLY]: 'weeklyScore',
				[LeaderboardPeriod.MONTHLY]: 'monthlyScore',
				[LeaderboardPeriod.YEARLY]: 'yearlyScore',
				[LeaderboardPeriod.GLOBAL]: 'weeklyScore',
			};
			const scoreField = scoreFieldMap[periodString] || 'weeklyScore';

			const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry, index) => {
				const scoreValue =
					scoreField === 'weeklyScore'
						? entry.weeklyScore
						: scoreField === 'monthlyScore'
							? entry.monthlyScore
							: scoreField === 'yearlyScore'
								? entry.yearlyScore
								: entry.weeklyScore;
				return {
					userId: entry.userId,
					email: entry.user?.email || '',
					firstName: entry.user?.firstName,
					lastName: entry.user?.lastName,
					avatar: entry.user?.preferences?.avatar,
					rank: index + 1,
					score: scoreValue ?? 0,
					averageScore: entry.overallSuccessRate ?? 0,
					bestScore: entry.bestGameScore ?? 0,
					gamesPlayed: entry.totalGames ?? 0,
					lastPlayed: entry.lastPlayDate ?? entry.createdAt,
					successRate: entry.overallSuccessRate ?? 0,
					totalGames: entry.totalGames ?? 0,
					totalQuestionsAnswered: entry.totalQuestionsAnswered ?? 0,
					totalPlayTime: entry.totalPlayTime ?? 0,
				};
			});

			const response: LeaderboardResponse = {
				leaderboard: leaderboardEntries,
				pagination: {
					limit: limitNum,
					offset: 0,
					total: leaderboard.length,
					hasMore: calculateHasMore(0, leaderboardEntries.length, leaderboard.length),
				},
				period: periodString,
			};
			return response;
		} catch (error) {
			logger.userError('Error getting period leaderboard', {
				errorInfo: { message: getErrorMessage(error) },
				period: periodParam || query.type || 'weekly',
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
			const periodString = query.period;

			if (!isOneOf(VALID_LEADERBOARD_PERIODS)(periodString)) {
				throw new HttpException(ERROR_CODES.INVALID_PERIOD, HttpStatus.BAD_REQUEST);
			}

			const stats = await this.leaderboardAnalyticsService.getLeaderboardStats(periodString);

			logger.apiRead('leaderboard_stats', {
				period: periodString,
				activeUsers: stats.activeUsers,
				averageScore: stats.averageScore,
				averageGames: stats.averageGames,
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
