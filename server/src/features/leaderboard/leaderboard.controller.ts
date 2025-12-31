import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import {
	API_ROUTES,
	CACHE_DURATION,
	ERROR_CODES,
	LeaderboardPeriod,
	UserRole,
	VALID_LEADERBOARD_PERIODS,
} from '@shared/constants';
import type { LeaderboardEntry, LeaderboardResponse } from '@shared/types';
import { calculateHasMore, getErrorMessage, isOneOf } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import { Cache, CurrentUserId, NoCache, Roles } from '../../common';
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
@Controller(API_ROUTES.LEADERBOARD.BASE)
export class LeaderboardController {
	constructor(private readonly leaderboardService: LeaderboardService) {}

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
	@Cache(CACHE_DURATION.LONG)
	async getGlobalLeaderboard(@Query() query: GetLeaderboardDto) {
		try {
			const limitNum = query.limit;
			const offsetNum = query.offset;

			if (limitNum > 1000) {
				throw new HttpException(ERROR_CODES.LIMIT_CANNOT_EXCEED_1000, HttpStatus.BAD_REQUEST);
			}

			const leaderboard = await this.leaderboardService.getGlobalLeaderboard(limitNum, offsetNum);

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
				rank: entry.rank ?? index + offsetNum + 1,
				score: entry.score,
				averageScore: entry.userStats?.overallSuccessRate ?? 0,
				bestScore: entry.userStats?.bestGameScore ?? 0,
				gamesPlayed: entry.userStats?.totalGames ?? 0,
				lastPlayed: entry.userStats?.lastPlayDate ?? entry.createdAt,
				successRate: entry.userStats?.overallSuccessRate ?? 0,
				totalGames: entry.userStats?.totalGames ?? 0,
				totalQuestionsAnswered: entry.userStats?.totalQuestionsAnswered ?? 0,
				totalPlayTime: entry.userStats?.totalPlayTime ?? 0,
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
	@Cache(CACHE_DURATION.EXTENDED)
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

			// TypeScript now knows periodString is LeaderboardPeriod due to type guard
			const leaderboard = await this.leaderboardService.getLeaderboardByPeriod(periodString, limitNum);

			logger.apiRead('leaderboard_period', {
				period: periodString,
				limit: limitNum,
				resultsCount: leaderboard.length,
			});

			const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
				userId: entry.userId,
				email: entry.user?.email || '',
				firstName: entry.user?.firstName,
				lastName: entry.user?.lastName,
				avatar: entry.user?.preferences?.avatar,
				rank: entry.rank ?? index + 1,
				score: entry.score,
				averageScore: entry.userStats?.overallSuccessRate ?? 0,
				bestScore: entry.userStats?.bestGameScore ?? 0,
				gamesPlayed: entry.userStats?.totalGames ?? 0,
				lastPlayed: entry.userStats?.lastPlayDate ?? entry.createdAt,
				successRate: entry.userStats?.overallSuccessRate ?? 0,
				totalGames: entry.userStats?.totalGames ?? 0,
				totalQuestionsAnswered: entry.userStats?.totalQuestionsAnswered ?? 0,
				totalPlayTime: entry.userStats?.totalPlayTime ?? 0,
			}));

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
	@Cache(CACHE_DURATION.MEDIUM)
	async getLeaderboardStats(@Query() query: GetLeaderboardStatsDto) {
		try {
			const periodString = query.period;

			if (!isOneOf(VALID_LEADERBOARD_PERIODS)(periodString)) {
				throw new HttpException(ERROR_CODES.INVALID_PERIOD, HttpStatus.BAD_REQUEST);
			}

			// TypeScript now knows periodString is LeaderboardPeriod due to type guard
			const stats = await this.leaderboardService.getLeaderboardStats(periodString);

			logger.apiRead('leaderboard_stats', {
				period: periodString,
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
	@NoCache()
	async clearAllLeaderboard(@CurrentUserId() userId: string) {
		try {
			const result = await this.leaderboardService.clearAllLeaderboard();

			logger.apiDelete('leaderboard_admin_clear_all', {
				userId,
				deletedCount: result.deletedCount,
			});

			return result;
		} catch (error) {
			logger.userError('Failed to clear all leaderboard', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}
}
