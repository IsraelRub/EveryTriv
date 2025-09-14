import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { serverLogger as logger } from '@shared';

import { Cache, ClientIP, CurrentUserId, UserAgent } from '../../common';
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
	async trackEvent(
		@CurrentUserId() userId: string,
		@Body() eventData: TrackEventDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
		// Log analytics tracking with IP and User Agent
		logger.logUserActivity(userId, 'Analytics event tracked', {
			eventType: eventData.eventType,
			ip,
			userAgent,
		});

		// Convert DTO to service format
		const analyticsEventData = {
			...eventData,
			timestamp: eventData.timestamp || new Date(),
		};
		await this.analyticsService.trackEvent(userId, analyticsEventData);
		return { message: 'Analytics event tracked successfully' };
	}

	/**
	 * Get game statistics
	 */
	@Get('game/stats')
	@Cache(900) // Cache for 15 minutes
	async getGameStats(@Query() query: GameAnalyticsQueryDto) {
		return await this.analyticsService.getGameStats(query);
	}

	/**
	 * Get user analytics
	 */
	@Get('user/')
	@Cache(600) // Cache for 10 minutes
	async getUserAnalytics(@CurrentUserId() userId: string) {
		const result = await this.analyticsService.getUserAnalytics(userId);
		return result;
	}

	/**
	 * Get popular topics
	 */
	@Get('topics/popular')
	@Cache(1800) // Cache for 30 minutes
	async getPopularTopics(@Query() query: TopicAnalyticsQueryDto) {
		const result = await this.analyticsService.getTopicStats(query);
		return result;
	}

	/**
	 * Get difficulty statistics
	 */
	@Get('difficulty/stats')
	@Cache(1800) // Cache for 30 minutes
	async getDifficultyStats(@Query() query: DifficultyAnalyticsQueryDto) {
		const result = await this.analyticsService.getDifficultyStats(query);
		return result;
	}
}
