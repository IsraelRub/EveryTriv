import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CACHE_DURATION } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Cache } from '../../common';
import { AnalyticsService } from './analytics.service';
import { DifficultyAnalyticsQueryDto, GameAnalyticsQueryDto, TopicAnalyticsQueryDto, TrackEventDto } from './dtos';

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
	 * Get game statistics
	 */
	@Get('game/stats')
	@Cache(CACHE_DURATION.EXTENDED) // Cache for 15 minutes
	async getGameStats(@Query() query: GameAnalyticsQueryDto) {
		try {
			const result = await this.analyticsService.getGameStats(query);

			logger.apiRead('analytics_game_stats', {
				query: Object.keys(query),
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error getting game stats', {
				error: getErrorMessage(error),
				query: Object.keys(query),
			});
			throw error;
		}
	}

	/**
	 * Get user analytics
	 */
	@Get('user/')
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getUserAnalytics(@Param('userId') userId: string) {
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
}
