import { Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { CACHE_DURATION } from '@shared/constants';

import { Cache, CurrentUserId } from '../../common';
import { Public } from '../../common/decorators/auth.decorator';
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
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserRanking(@CurrentUserId() userId: string) {
		try {
			const ranking = await this.leaderboardService.getUserRanking(userId);

			if (!ranking) {
				// Create initial ranking if doesn't exist
				const newRanking = await this.leaderboardService.updateUserRanking(userId);

				logger.apiCreate('leaderboard_user_ranking_created', {
					userId,
				});

				return newRanking;
			}

			logger.apiRead('leaderboard_user_ranking', {
				userId,
				rank: ranking.rank,
			});

			return ranking;
		} catch (error) {
			logger.userError('Error getting user ranking', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
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

			logger.apiUpdate('leaderboard_user_ranking_update', {
				userId,
				rank: ranking.rank,
				score: ranking.score,
			});

			return ranking;
		} catch (error) {
			logger.userError('Error updating user ranking', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get global leaderboard
	 * @param limit Number of users to return
	 * @param offset Offset for pagination
	 * @returns Global leaderboard data
	 */
	@Get('global')
	@Public()
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;
			const offsetNum = query.offset || 0;

			if (limitNum > 1000) {
				throw new HttpException('Limit cannot exceed 1000', HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardService.getGlobalLeaderboard(limitNum, offsetNum);

			logger.apiRead('leaderboard_global', {
				limit: limitNum,
				offset: offsetNum,
				resultsCount: leaderboard.length,
			});

			return {
				leaderboard,
				pagination: {
					limit: limitNum,
					offset: offsetNum,
					total: leaderboard.length,
				},
			};
		} catch (error) {
			logger.userError('Error getting global leaderboard', {
				error: getErrorMessage(error),
				limit: query.limit,
				offset: query.offset,
			});
			throw error;
		}
	}

	/**
	 * Get leaderboard by time period
	 * @param period Time period (weekly, monthly, yearly)
	 * @param limit Number of users to return
	 * @returns Leaderboard for specific time period
	 */
	@Get('period/:period')
	@Public()
	@Cache(CACHE_DURATION.EXTENDED) // Cache for 15 minutes
	async getLeaderboardByPeriod(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;
			const period = query.type || 'weekly';

			if (!['weekly', 'monthly', 'yearly'].includes(period)) {
				throw new HttpException('Invalid period. Must be weekly, monthly, or yearly', HttpStatus.BAD_REQUEST);
			}

			if (limitNum > 1000) {
				throw new HttpException('Limit cannot exceed 1000', HttpStatus.BAD_REQUEST);
			}

			// Ensure period is one of the allowed values for getLeaderboardByPeriod
			const validPeriod = period as 'weekly' | 'monthly' | 'yearly';
			const leaderboard = await this.leaderboardService.getLeaderboardByPeriod(validPeriod, limitNum);

			logger.apiRead('leaderboard_period', {
				period,
				limit: limitNum,
				resultsCount: leaderboard.length,
			});

			return {
				period,
				leaderboard,
				pagination: {
					limit: limitNum,
					total: leaderboard.length,
				},
			};
		} catch (error) {
			logger.userError('Error getting period leaderboard', {
				error: getErrorMessage(error),
				period: query.type || 'weekly',
				limit: query.limit,
			});
			throw error;
		}
	}

	/**
	 * Get user percentile
	 * @param userId Authenticated user ID
	 * @returns User percentile
	 */
	@Get('user/percentile')
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getUserPercentile(@CurrentUserId() userId: string) {
		try {
			const percentile = await this.leaderboardService.getUserPercentile(userId);

			logger.apiRead('leaderboard_user_percentile', {
				userId,
				percentile,
			});

			return {
				userId,
				percentile,
			};
		} catch (error) {
			logger.userError('Error getting user percentile', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}
}
