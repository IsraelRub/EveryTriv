import { Controller, Get, HttpException, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { LoggerService } from '@shared/modules';
import { clamp } from 'everytriv-shared/utils';

import { AuthGuard } from '../../../../shared/modules/auth';
import { ScoringService } from './scoring.service';

/**
 * Controller for game scoring and leaderboard operations
 * Handles user scores, leaderboard, and scoring statistics
 */
@Controller('api/scoring')
@UseGuards(AuthGuard)
export class ScoringController {
	constructor(
		private readonly scoringService: ScoringService,
		private readonly logger: LoggerService
	) {}

	/**
	 * Get user score
	 * @param userId The user ID
	 * @returns Promise<UserScoreData> User score data
	 */
	@Get('score')
	async getUserScore(@Query('userId') userId: string) {
		if (!userId) {
			throw new HttpException(
				{
					status: HttpStatus.BAD_REQUEST,
					message: 'userId is required',
				},
				HttpStatus.BAD_REQUEST
			);
		}

		try {
			const score = await this.scoringService.getUserScore(userId);
			return score;
		} catch (err) {
			throw new HttpException(
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: 'Failed to retrieve user score',
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Get leaderboard
	 * @param limit Number of users to return
	 * @returns Promise<LeaderboardEntry[]> Leaderboard data
	 */
	@Get('leaderboard')
	async getLeaderboard(@Query('limit') limit = 10) {
		const validatedLimit = clamp(Number(limit), 1, 100);

		try {
			const leaderboard = await this.scoringService.getLeaderboard(validatedLimit);
			return {
				leaderboard,
				meta: {
					limit: validatedLimit,
					total: leaderboard.length,
				},
			};
		} catch (err) {
			throw new HttpException(
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: 'Failed to retrieve leaderboard',
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Get scoring statistics
	 * @returns Promise<{
	 *   totalUsers: number;
	 *   averageScore: number;
	 *   topScores: LeaderboardEntry[];
	 *   recentGames: number;
	 * }> - Scoring statistics
	 */
	@Get('stats')
	async getScoringStats() {
		try {
			this.logger.gameStatistics('Getting scoring statistics', {});

			// Get real statistics from database
			const stats = await this.scoringService.getGlobalStats();

			return stats;
		} catch (error) {
			this.logger.gameError('Failed to get scoring stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new HttpException(
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: 'Failed to retrieve scoring statistics',
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
