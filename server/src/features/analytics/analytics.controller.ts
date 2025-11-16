import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CACHE_DURATION, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUser, CurrentUserId, Roles } from '../../common';
import { Public } from '../../common/decorators/auth.decorator';
import { AnalyticsService } from './analytics.service';
import {
	DifficultyAnalyticsQueryDto,
	TopicAnalyticsQueryDto,
	TrackEventDto,
	UserActivityQueryDto,
	UserComparisonQueryDto,
	UserIdParamDto,
	UserSummaryQueryDto,
	UserTrendQueryDto,
} from './dtos';

/**
 * Analytics controller for tracking user behavior and retrieving analytics data
 */
@Controller('analytics')
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	/**
	 * Track analytics event
	 */
	@Post('track')
	async trackEvent(@Body() eventData: TrackEventDto) {
		try {
			if (!eventData.eventType) {
				throw new HttpException('Event type is required', HttpStatus.BAD_REQUEST);
			}

			// Convert DTO to service format
			const analyticsEventData = {
				...eventData,
				timestamp: eventData.timestamp || new Date(),
			};

			await this.analyticsService.trackEvent(eventData.userId || '', analyticsEventData);

			logger.apiCreate('analytics_event_track', {
				eventType: eventData.eventType,
			});

			return { tracked: true };
		} catch (error) {
			logger.analyticsError('Error tracking analytics event', {
				error: getErrorMessage(error),
				eventType: eventData.eventType,
			});
			throw error;
		}
	}

	/**
	 * Get analytics for the authenticated user
	 */
	@Get('user')
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getAuthenticatedUserAnalytics(@CurrentUserId() userId: string) {
		try {
			const result = await this.analyticsService.getUserAnalytics(userId);

			logger.apiRead('analytics_user', {
				userId,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user analytics', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user statistics overview (Admin only)
	 */
	@Get('user-stats/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserStats(@Param() params: UserIdParamDto) {
		try {
			const result = await this.analyticsService.getUserStatistics(params.userId);

			logger.apiRead('analytics_user_stats', {
				userId: params.userId,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user stats', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get user performance metrics (Admin only)
	 */
	@Get('user-performance/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserPerformance(@Param() params: UserIdParamDto) {
		try {
			const result = await this.analyticsService.getUserPerformance(params.userId);

			logger.apiRead('analytics_user_performance', {
				userId: params.userId,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user performance', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get user progress analytics (Admin only)
	 */
	@Get('user-progress/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserProgress(@Param() params: UserIdParamDto, @Query() query: UserTrendQueryDto) {
		try {
			const result = await this.analyticsService.getUserProgress(params.userId, query);

			logger.apiRead('analytics_user_progress', {
				userId: params.userId,
				query: Object.keys(query ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user progress', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get detailed user activity (Admin only)
	 */
	@Get('user-activity/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
	async getUserActivity(@Param() params: UserIdParamDto, @Query() query: UserActivityQueryDto) {
		try {
			const result = await this.analyticsService.getUserActivity(params.userId, query);

			logger.apiRead('analytics_user_activity', {
				userId: params.userId,
				query: Object.keys(query ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user activity', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get user insights (Admin only)
	 */
	@Get('user-insights/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserInsights(@Param() params: UserIdParamDto) {
		try {
			const result = await this.analyticsService.getUserInsights(params.userId);

			logger.apiRead('analytics_user_insights', {
				userId: params.userId,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user insights', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get personalized user recommendations (Admin only)
	 */
	@Get('user-recommendations/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT + 60) // Cache for 2 minutes
	async getUserRecommendations(@Param() params: UserIdParamDto) {
		try {
			const result = await this.analyticsService.getUserRecommendations(params.userId);

			logger.apiRead('analytics_user_recommendations', {
				userId: params.userId,
				count: result.data?.length ?? 0,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user recommendations', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get user achievements (Admin only)
	 */
	@Get('user-achievements/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getUserAchievements(@Param() params: UserIdParamDto) {
		try {
			const result = await this.analyticsService.getUserAchievements(params.userId);

			logger.apiRead('analytics_user_achievements', {
				userId: params.userId,
				resultsCount: result.data?.length ?? 0,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user achievements', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get user trend timeline (Admin only)
	 */
	@Get('user-trends/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
	async getUserTrends(@Param() params: UserIdParamDto, @Query() query: UserTrendQueryDto) {
		try {
			const result = await this.analyticsService.getUserTrends(params.userId, query);

			logger.apiRead('analytics_user_trends', {
				userId: params.userId,
				query: Object.keys(query ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user trends', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Compare user metrics with another user or global averages (Admin only)
	 */
	@Get('user-comparison/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async compareUser(@Param() params: UserIdParamDto, @Query() query: UserComparisonQueryDto) {
		try {
			const result = await this.analyticsService.compareUserPerformance(params.userId, query);

			logger.apiRead('analytics_user_comparison', {
				userId: params.userId,
				targetUserId: query?.targetUserId,
				type: query?.target ?? 'global',
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error comparing users', {
				error: getErrorMessage(error),
				userId: params.userId,
				targetUserId: query?.targetUserId,
			});
			throw error;
		}
	}

	/**
	 * Get user summary (Admin only)
	 */
	@Get('user-summary/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserSummary(@Param() params: UserIdParamDto, @Query() query: UserSummaryQueryDto) {
		try {
			const result = await this.analyticsService.getUserSummary(params.userId, query?.includeActivity ?? false);

			logger.apiRead('analytics_user_summary', {
				userId: params.userId,
				options: query?.includeActivity ? 'include_activity' : 'default',
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting user summary', {
				error: getErrorMessage(error),
				userId: params.userId,
			});
			throw error;
		}
	}

	/**
	 * Get popular topics
	 */
	@Get('topics/popular')
	@Cache(CACHE_DURATION.VERY_LONG) // Cache for 30 minutes
	async getPopularTopics(@Query() query: TopicAnalyticsQueryDto) {
		try {
			const result = await this.analyticsService.getTopicStats(query);

			logger.apiRead('analytics_popular_topics', {
				query: Object.keys(query),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting popular topics', {
				error: getErrorMessage(error),
				query: Object.keys(query),
			});
			throw error;
		}
	}

	/**
	 * Get difficulty statistics
	 */
	@Get('difficulty/stats')
	@Cache(CACHE_DURATION.VERY_LONG) // Cache for 30 minutes
	async getDifficultyStats(@Query() query: DifficultyAnalyticsQueryDto) {
		try {
			const result = await this.analyticsService.getDifficultyStats(query);

			logger.apiRead('analytics_difficulty_stats', {
				query: Object.keys(query),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting difficulty stats', {
				error: getErrorMessage(error),
				query: Object.keys(query),
			});
			throw error;
		}
	}

	/**
	 * Get global statistics for comparison (public endpoint)
	 */
	@Get('global-stats')
	@Public()
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getGlobalStats() {
		try {
			const result = await this.analyticsService.getGlobalStats();

			logger.apiRead('analytics_global_stats', {});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global stats', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all user stats (admin only)
	 */
	@Delete('admin/stats/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllUserStats(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.analyticsService.clearAllUserStats();

			logger.apiDelete('analytics_admin_clear_all_user_stats', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				cleared: true,
				deletedCount: result.deletedCount,
				message: result.message,
			};
		} catch (error) {
			logger.userError('Failed to clear all user stats', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}
}
