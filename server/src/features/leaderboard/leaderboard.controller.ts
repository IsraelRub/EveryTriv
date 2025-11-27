import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CACHE_DURATION, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUser, CurrentUserId, NoCache, Roles } from '../../common';
import { Public } from '../../common/decorators/auth.decorator';
import { GetLeaderboardDto, GetLeaderboardStatsDto } from './dtos';
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

	private isLeaderboardPeriod(value: string): value is 'weekly' | 'monthly' | 'yearly' {
		return value === 'weekly' || value === 'monthly' || value === 'yearly';
	}

	/**
	 * Get user ranking
	 * @param userId Authenticated user ID
	 * @returns User ranking data
	 */
	@Get('user/ranking')
	@NoCache()
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
	 * @param query Leaderboard query parameters
	 * @returns Global leaderboard data
	 */
	@Get('global')
	@Public()
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;
			const offsetNum = query.offset ?? 0;

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
	 * @param periodParam Time period parameter (weekly, monthly, yearly)
	 * @param query Leaderboard query parameters
	 * @returns Leaderboard for specific time period
	 */
	@Get('period/:period')
	@Public()
	@Cache(CACHE_DURATION.EXTENDED) // Cache for 15 minutes
	async getLeaderboardByPeriod(@Param('period') periodParam: string, @Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit || 100;
			const period = periodParam || query.type || 'weekly';

			if (!this.isLeaderboardPeriod(period)) {
				throw new HttpException('Invalid period. Must be weekly, monthly, or yearly', HttpStatus.BAD_REQUEST);
			}

			if (limitNum > 1000) {
				throw new HttpException('Limit cannot exceed 1000', HttpStatus.BAD_REQUEST);
			}

			// Ensure period is one of the allowed values for getLeaderboardByPeriod
			const leaderboard = await this.leaderboardService.getLeaderboardByPeriod(period, limitNum);

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
				period: periodParam || query.type || 'weekly',
				limit: query.limit,
			});
			throw error;
		}
	}

	/**
	 * Get leaderboard statistics for a specific period
	 * @param query Leaderboard statistics query parameters
	 * @returns Leaderboard statistics
	 */
	@Get('stats')
	@Public()
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getLeaderboardStats(@Query() query: GetLeaderboardStatsDto) {
		try {
			const period = query.period || 'weekly';

			if (!this.isLeaderboardPeriod(period)) {
				throw new HttpException('Invalid period. Must be weekly, monthly, or yearly', HttpStatus.BAD_REQUEST);
			}

			const stats = await this.leaderboardService.getLeaderboardStats(period);

			logger.apiRead('leaderboard_stats', {
				period,
				activeUsers: stats.activeUsers,
				averageScore: stats.averageScore,
				averageGames: stats.averageGames,
			});

			return stats;
		} catch (error) {
			logger.userError('Error getting leaderboard stats', {
				error: getErrorMessage(error),
				period: query.period,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all leaderboard entries (admin only)
	 * @param user Current admin user token payload
	 * @returns Clear operation result with deleted count
	 */
	@Delete('admin/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllLeaderboard(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.leaderboardService.clearAllLeaderboard();

			logger.apiDelete('leaderboard_admin_clear_all', {
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
			logger.userError('Failed to clear all leaderboard', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}
}
