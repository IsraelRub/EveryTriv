import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { roundToDecimals } from 'everytriv-shared/utils';
import { MoreThan, Repository } from 'typeorm';

import { LoggerService } from '../../../../shared/controllers';
import { GameHistoryEntity, UserEntity } from '../../../../shared/entities';

/**
 * Service for managing game scoring, user points, and game logic
 * Handles point calculation, user score updates, leaderboard management, and game operations
 */
@Injectable()
export class ScoringService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		private readonly logger: LoggerService
	) {}

	/**
	 * Calculate points for a correct answer
	 * @param difficulty Difficulty level
	 * @param timeSpent Time spent answering in seconds
	 * @param streak Current streak
	 * @returns Calculated points
	 */
	calculatePoints(difficulty: string, timeSpent: number, streak: number = 0): number {
		try {
			this.logger.gameStatistics('Calculating points', {
				difficulty,
				timeSpent,
				streak,
			});

			// Base points by difficulty
			const basePoints = {
				easy: 10,
				medium: 20,
				hard: 30,
			};

			const base = basePoints[difficulty as keyof typeof basePoints] || 10;

			// Time bonus (faster = more points)
			const maxTime = 30; // 30 seconds
			const timeBonus = Math.max(0, Math.floor((maxTime - timeSpent) / 2));

			// Streak bonus
			const streakBonus = Math.floor(streak / 3) * 5; // Every 3 correct answers = 5 bonus points

			// Difficulty multiplier
			const difficultyMultiplier = {
				easy: 1,
				medium: 1.5,
				hard: 2,
			};

			const multiplier = difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1;

			const totalPoints = Math.floor((base + timeBonus + streakBonus) * multiplier);

			this.logger.gameStatistics('Points calculated', {
				base,
				timeBonus,
				streakBonus,
				multiplier,
				totalPoints,
			});

			return Math.max(1, totalPoints); // Minimum 1 point
		} catch (error) {
			this.logger.gameError('Failed to calculate points', {
				error: error instanceof Error ? error.message : 'Unknown error',
				difficulty,
				timeSpent,
				streak,
			});
			return 10; // Default fallback
		}
	}

	/**
	 * Update user points
	 * @param userId User ID
	 * @param points Points to add
	 * @returns Updated user score
	 */
	async updateUserPoints(userId: string, points: number) {
		try {
			this.logger.userInfo('Updating user points', {
				userId,
				points,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			user.score += points;
			await this.userRepository.save(user);

			this.logger.userInfo('User points updated', {
				userId,
				oldScore: user.score - points,
				newScore: user.score,
				pointsAdded: points,
			});

			return user.score;
		} catch (error) {
			this.logger.userError('Failed to update user points', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Get user score
	 * @param userId User ID
	 * @returns User score
	 */
	async getUserScore(userId: string): Promise<number> {
		try {
			this.logger.userDebug('Getting user score', {
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			return user.score;
		} catch (error) {
			this.logger.userError('Failed to get user score', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get leaderboard
	 * @param limit Number of entries to return
	 * @returns Leaderboard data
	 */
	async getLeaderboard(limit: number = 10) {
		try {
			this.logger.gameStatistics('Getting leaderboard', {
				limit,
			});

			// Get top users by score
			const topUsers = await this.userRepository.find({
				select: ['id', 'username', 'score', 'avatar'],
				where: { isActive: true },
				order: { score: 'DESC' },
				take: limit,
			});

			// Get user statistics for leaderboard
			const leaderboard = await Promise.all(
				topUsers.map(async (user, index) => {
					const stats = await this.getUserGameStats(user.id);
					return {
						rank: index + 1,
						userId: user.id,
						username: user.username,
						score: user.score,
						avatar: user.avatar,
						totalQuestions: stats.totalQuestions,
						correctAnswers: stats.correctAnswers,
						successRate: stats.successRate,
					};
				})
			);

			return leaderboard;
		} catch (error) {
			this.logger.gameError('Failed to get leaderboard', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get limited leaderboard (top N users)
	 * @param limit Number of entries
	 * @returns Limited leaderboard
	 */
	async getLeaderboardLimited(limit: number = 5) {
		return this.getLeaderboard(limit);
	}

	/**
	 * Get user game statistics
	 * @param userId User ID
	 * @returns User game statistics
	 */
	private async getUserGameStats(userId: string): Promise<{
		totalQuestions: number;
		correctAnswers: number;
		successRate: number;
	}> {
		try {
			const totalQuestions = await this.gameHistoryRepository.count({
				where: { userId },
			});

			const correctAnswers = await this.gameHistoryRepository.count({
				where: { userId },
			});

			const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

			return {
				totalQuestions,
				correctAnswers,
				successRate,
			};
		} catch (error) {
			return {
				totalQuestions: 0,
				correctAnswers: 0,
				successRate: 0,
			};
		}
	}

	/**
	 * Get user score data
	 * @param userId User ID
	 * @returns User score data
	 */
	async getUserScoreData(userId: string): Promise<{
		userId: string;
		score: number;
		rank: number;
	}> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Get user's rank
			const rank = await this.getUserRank(userId);

			return {
				userId: user.id,
				score: user.score,
				rank,
			};
		} catch (error) {
			throw new Error(`Failed to get user score data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get user rank
	 * @param userId User ID
	 * @returns User rank
	 */
	private async getUserRank(userId: string): Promise<number> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				return 0;
			}

			const rank = await this.userRepository.count({
				where: {
					isActive: true,
					score: MoreThan(user.score),
				},
			});

			return rank + 1;
		} catch (error) {
			return 0;
		}
	}

	/**
	 * Reset user score
	 * @param userId User ID
	 * @returns Reset result
	 */
	async resetUserScore(userId: string) {
		try {
			this.logger.userInfo('Resetting user score', {
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const oldScore = user.score;
			user.score = 0;
			await this.userRepository.save(user);

			this.logger.userInfo('User score reset', {
				userId,
				oldScore,
				newScore: 0,
			});

			return {
				success: true,
				oldScore,
				newScore: 0,
			};
		} catch (error) {
			this.logger.userError('Failed to reset user score', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get global statistics
	 * @returns Global statistics
	 */
	async getGlobalStats() {
		try {
			this.logger.gameStatistics('Getting global stats', {});

			const totalUsers = await this.userRepository.count({
				where: { isActive: true },
			});

			const totalScore = await this.userRepository
				.createQueryBuilder('user')
				.select('SUM(user.score)', 'total')
				.where('user.is_active = :isActive', { isActive: true })
				.getRawOne();

			const averageScore = totalUsers > 0 ? parseInt(totalScore?.total || '0') / totalUsers : 0;

			return {
				totalUsers,
				totalScore: parseInt(totalScore?.total || '0'),
				averageScore: roundToDecimals(averageScore, 2),
			};
		} catch (error) {
			this.logger.gameError('Failed to get global stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
