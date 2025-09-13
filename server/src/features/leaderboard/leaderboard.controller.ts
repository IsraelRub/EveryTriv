import { Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { serverLogger as logger } from '@shared';

import { CurrentUserId } from '../../common';
import { GetLeaderboardDto } from './dtos';
import { LeaderboardService } from './leaderboard.service';

/**
 * Leaderboard Controller
 *
 * @controller LeaderboardController
 * @description Controller for managing leaderboard and ranking endpoints
 * @used_by client/src/services/api/api.service.ts
 */
@Controller('leaderboard')
export class LeaderboardController {
	constructor(private readonly leaderboardService: LeaderboardService) {}

	/**
	 * Get user ranking
	 * @param userId Authenticated user ID
	 * @returns User ranking data
	 */
	@Get('user/ranking')
	async getUserRanking(@CurrentUserId() userId: string) {
		try {
			const ranking = await this.leaderboardService.getUserRanking(userId);

			if (!ranking) {
				// Create initial ranking if doesn't exist
				const newRanking = await this.leaderboardService.updateUserRanking(userId);
				return newRanking;
			}

			return ranking;
		} catch (error) {
			logger.analyticsError('getUserRanking', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: userId,
			});
			throw new HttpException('Failed to get user ranking', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Update user ranking
	 * @param userId Authenticated user ID
	 * @returns Updated ranking data
	 */
	@Post('user/update')
	async updateUserRanking(@CurrentUserId() userId: string) {
		try {
			const ranking = await this.leaderboardService.updateUserRanking(userId);

			logger.analyticsTrack('User ranking updated', {
				userId: userId,
				rank: ranking.rank,
				score: ranking.score,
			});

			return ranking;
		} catch (error) {
			logger.analyticsError('updateUserRanking', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: userId,
			});
			throw new HttpException('Failed to update user ranking', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Get global leaderboard
	 * @param limit Number of users to return
	 * @param offset Offset for pagination
	 * @returns Global leaderboard data
	 */
	@Get('global')
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;
			const offsetNum = query.offset || 0;

			if (limitNum > 1000) {
				throw new HttpException('Limit cannot exceed 1000', HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardService.getGlobalLeaderboard(limitNum, offsetNum);

			return {
				leaderboard,
				pagination: {
					limit: limitNum,
					offset: offsetNum,
					total: leaderboard.length,
				},
			};
		} catch (error) {
			logger.analyticsError('getGlobalLeaderboard', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new HttpException('Failed to get global leaderboard', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Get leaderboard by time period
	 * @param period Time period (weekly, monthly, yearly)
	 * @param limit Number of users to return
	 * @returns Leaderboard for specific time period
	 */
	@Get('period/:period')
	async getLeaderboardByPeriod(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;

			if (!['weekly', 'monthly', 'yearly'].includes(query.type || 'weekly')) {
				throw new HttpException('Invalid period. Must be weekly, monthly, or yearly', HttpStatus.BAD_REQUEST);
			}

			if (limitNum > 1000) {
				throw new HttpException('Limit cannot exceed 1000', HttpStatus.BAD_REQUEST);
			}

			const period = query.type === 'topic' ? 'weekly' : query.type || 'weekly';
			// Ensure period is one of the allowed values for getLeaderboardByPeriod
			const validPeriod = period === 'global' ? 'weekly' : (period as 'weekly' | 'monthly' | 'yearly');
			const leaderboard = await this.leaderboardService.getLeaderboardByPeriod(validPeriod, limitNum);

			return {
				period: query.type || 'weekly',
				leaderboard,
				pagination: {
					limit: limitNum,
					total: leaderboard.length,
				},
			};
		} catch (error) {
			logger.analyticsError('getLeaderboardByPeriod', {
				error: error instanceof Error ? error.message : 'Unknown error',
				period: query.type || 'weekly',
			});
			throw new HttpException('Failed to get period leaderboard', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Get user percentile
	 * @param userId Authenticated user ID
	 * @returns User percentile
	 */
	@Get('user/percentile')
	async getUserPercentile(@CurrentUserId() userId: string) {
		try {
			const percentile = await this.leaderboardService.getUserPercentile(userId);

			return {
				userId: userId,
				percentile,
			};
		} catch (error) {
			logger.analyticsError('getUserPercentile', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: userId,
			});
			throw new HttpException('Failed to get user percentile', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
