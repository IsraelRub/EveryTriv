import { Controller, Get, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { AnalyticsEventData, UserAnalyticsQuery } from 'everytriv-shared/types';

import { ValidationService } from '../../common';
import { LoggerService } from '../../shared/controllers';
import { AuthRequest } from '../../shared/types';
import { AnalyticsService } from './analytics.service';

/**
 * Analytics controller for tracking user behavior and retrieving analytics data
 */
@Controller('analytics')
export class AnalyticsController {
	constructor(
		private readonly analyticsService: AnalyticsService,
		private readonly logger: LoggerService,
		private readonly validationService: ValidationService
	) {}

	/**
	 * Track analytics event
	 */
	@Post('track')
	async trackEvent(@Req() req: AuthRequest, eventData: AnalyticsEventData) {
		try {
			// Validate user is authenticated
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			// Validate event data
			const validationResult = await this.validationService.validateInputContent(JSON.stringify(eventData), {
				customMessages: {
					content: 'Event data is invalid',
				},
			});

			if (!validationResult.isValid) {
				throw new HttpException(
					{
						message: 'Invalid event data',
						errors: validationResult.errors,
					},
					HttpStatus.BAD_REQUEST
				);
			}

			await this.analyticsService.trackEvent(req.user.id, eventData);
			return { message: 'Analytics event tracked successfully' };
		} catch (error) {
			this.logger.analyticsError('trackEvent', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get user statistics
	 */
	@Get('user/stats')
	async getUserStats(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			return await this.analyticsService.getUserStats(req.user.id);
		} catch (error) {
			this.logger.analyticsError('getUserStats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get game statistics
	 */
	@Get('game/stats')
	async getGameStats(query: UserAnalyticsQuery) {
		try {
			return await this.analyticsService.getGameStats(query);
		} catch (error) {
			this.logger.analyticsError('getGameStats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get popular topics
	 */
	@Get('topics/popular')
	async getPopularTopics(query: UserAnalyticsQuery) {
		try {
			return await this.analyticsService.getTopicStats(query);
		} catch (error) {
			this.logger.analyticsError('getPopularTopics', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get difficulty statistics
	 */
	@Get('difficulty/stats')
	async getDifficultyStats(query: UserAnalyticsQuery) {
		try {
			return await this.analyticsService.getDifficultyStats(query);
		} catch (error) {
			this.logger.analyticsError('getDifficultyStats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
