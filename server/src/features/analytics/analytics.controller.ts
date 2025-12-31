import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import {
	API_ROUTES,
	CACHE_DURATION,
	ComparisonTarget,
	ERROR_CODES,
	UserRole,
} from '@shared/constants';
import type { AnalyticsEventData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import type { TokenPayload } from '@internal/types';
import { Cache, CurrentUser, CurrentUserId, Roles } from '../../common';
import { Public } from '../../common/decorators/auth.decorator';
import { AnalyticsService } from './analytics.service';
import {
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
@Controller(API_ROUTES.ANALYTICS.BASE)
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	/**
	 * Track analytics event
	 * @param eventData Event tracking data
	 * @returns Event tracking confirmation
	 */
	@Post('track')
	async trackEvent(@Body() eventData: TrackEventDto) {
		try {
			if (!eventData.eventType) {
				throw new HttpException(ERROR_CODES.EVENT_TYPE_REQUIRED, HttpStatus.BAD_REQUEST);
			}

	// Convert DTO to service format - parse timestamp string to Date
	const analyticsEventData: AnalyticsEventData = {
		...eventData,
		timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
	};

		const result = await this.analyticsService.trackEvent(analyticsEventData);

		logger.apiCreate('analytics_event_track', {
			id: result.eventId,
			eventType: eventData.eventType,
		});

		return result;
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
	 * @param userId Current user identifier
	 * @returns User analytics data
	 */
	@Get('user')
	@Cache(CACHE_DURATION.LONG)
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
	 * Get user performance metrics (Admin only)
	 * @param params User identifier parameter
	 * @returns User performance metrics
	 */
	@Get('user-performance/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
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
	 * Get detailed user activity (Admin only)
	 * @param params User identifier parameter
	 * @param query Activity query parameters
	 * @returns User activity entries
	 */
	@Get('user-activity/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT)
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
	 * @param params User identifier parameter
	 * @returns User insights data
	 */
	@Get('user-insights/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
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
	 * Get user achievements (Admin only)
	 * @param params User identifier parameter
	 * @returns User achievements list
	 */
	@Get('user-achievements/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.LONG)
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
	 * @param params User identifier parameter
	 * @param query Trend query parameters
	 * @returns User trend data
	 */
	@Get('user-trends/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT)
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
	 * @param params User identifier parameter
	 * @param query Comparison query parameters
	 * @returns User comparison results
	 */
	@Get('user-comparison/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
	async compareUser(@Param() params: UserIdParamDto, @Query() query: UserComparisonQueryDto) {
		try {
			const result = await this.analyticsService.compareUserPerformance(params.userId, query);

			logger.apiRead('analytics_user_comparison', {
				userId: params.userId,
				targetUserId: query?.targetUserId,
				type: query?.target ?? ComparisonTarget.GLOBAL,
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
	 * @param params User identifier parameter
	 * @param query Summary query parameters
	 * @returns User summary data
	 */
	@Get('user-summary/:userId')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
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
	 * @param query Topic analytics query parameters
	 * @returns Popular topics statistics
	 */
	@Get('topics/popular')
	@Cache(CACHE_DURATION.VERY_LONG)
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
	 * Get global difficulty statistics for comparison (public endpoint)
	 * @returns Global difficulty statistics data
	 */
	@Get('difficulty/global')
	@Public()
	@Cache(CACHE_DURATION.VERY_LONG)
	async getGlobalDifficultyStats() {
		try {
			const result = await this.analyticsService.getGlobalDifficultyStats();

			logger.apiRead('analytics_global_difficulty_stats', {});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global difficulty stats', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get global statistics for comparison (public endpoint)
	 * @returns Global statistics data
	 */
	@Get('global-stats')
	@Public()
	@Cache(CACHE_DURATION.LONG)
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
	 * Get global trends (Admin only)
	 * @param query Trend query parameters
	 * @returns Global trend data
	 */
	@Get('global-trends')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
	async getGlobalTrends(@Query() query: UserTrendQueryDto) {
		try {
			const result = await this.analyticsService.getGlobalTrends(query);

			logger.apiRead('analytics_global_trends', {
				query: Object.keys(query ?? {}),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting global trends', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all user stats (admin only)
	 * @param user Current admin user token payload
	 * @returns Clear operation result with deleted count
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

			return result;
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
