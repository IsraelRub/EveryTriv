import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { serverLogger as logger } from '@shared';
import { GameHistoryEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';
import { CacheService } from 'src/internal/modules/cache';
import { Repository } from 'typeorm';

/**
 * User Stats Service
 *
 * @service UserStatsService
 * @description Service for managing user game statistics and performance metrics
 * @used_by server/src/features/analytics, server/src/features/game, server/src/features/leaderboard
 */
@Injectable()
export class UserStatsService {
	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepository: Repository<UserStatsEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		private readonly cacheService: CacheService
	) {}

	/**
	 * Get or create user stats
	 * @param userId User ID
	 * @returns User stats entity
	 */
	async getUserStats(userId: string): Promise<UserStatsEntity> {
		try {
			const cacheKey = `user:stats:${userId}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					let userStats = await this.userStatsRepository.findOne({
						where: { userId },
						relations: ['user'],
					});

					if (!userStats) {
						userStats = await this.createUserStats(userId);
					}

					return userStats;
				},
				3600 // Cache for 1 hour - user stats don't change frequently
			);
		} catch (error) {
			logger.analyticsError('getUserStats', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Create user stats for new user
	 * @param userId User ID
	 * @returns Created user stats
	 */
	async createUserStats(userId: string): Promise<UserStatsEntity> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const userStats = this.userStatsRepository.create({
				userId,
				totalGames: 0,
				totalQuestions: 0,
				correctAnswers: 0,
				incorrectAnswers: 0,
				overallSuccessRate: 0,
				currentStreak: 0,
				longestStreak: 0,
				consecutiveDaysPlayed: 0,
				topicStats: {},
				difficultyStats: {},
				weeklyScore: 0,
				monthlyScore: 0,
				yearlyScore: 0,
				averageTimePerQuestion: 0,
				totalPlayTime: 0,
				bestGameScore: 0,
				unlockedAchievements: [],
				totalAchievements: 0,
			});

			return await this.userStatsRepository.save(userStats);
		} catch (error) {
			logger.analyticsError('createUserStats', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user stats after game completion
	 * @param userId User ID
	 * @param gameData Game completion data
	 */
	async updateUserStatsAfterGame(
		userId: string,
		gameData: {
			score: number;
			totalQuestions: number;
			correctAnswers: number;
			timeTaken: number;
			topic: string;
			difficulty: string;
		}
	): Promise<void> {
		try {
			const userStats = await this.getUserStats(userId);

			// Update basic stats
			userStats.totalGames += 1;
			userStats.totalQuestions += gameData.totalQuestions;
			userStats.correctAnswers += gameData.correctAnswers;
			userStats.incorrectAnswers += gameData.totalQuestions - gameData.correctAnswers;

			// Recalculate success rate
			userStats.overallSuccessRate =
				userStats.totalQuestions > 0 ? (userStats.correctAnswers / userStats.totalQuestions) * 100 : 0;

			// Update time metrics
			userStats.totalPlayTime += gameData.timeTaken;
			userStats.averageTimePerQuestion =
				userStats.totalQuestions > 0 ? userStats.totalPlayTime / userStats.totalQuestions : 0;

			// Update best game score
			if (gameData.score > userStats.bestGameScore) {
				userStats.bestGameScore = gameData.score;
				userStats.bestGameDate = new Date();
			}

			// Update topic stats
			const topicKey = gameData.topic;
			if (!userStats.topicStats[topicKey]) {
				userStats.topicStats[topicKey] = {
					totalQuestions: 0,
					correctAnswers: 0,
					successRate: 0,
					lastPlayed: new Date(),
				};
			}
			userStats.topicStats[topicKey].totalQuestions += gameData.totalQuestions;
			userStats.topicStats[topicKey].correctAnswers += gameData.correctAnswers;
			userStats.topicStats[topicKey].successRate =
				userStats.topicStats[topicKey].totalQuestions > 0
					? (userStats.topicStats[topicKey].correctAnswers / userStats.topicStats[topicKey].totalQuestions) * 100
					: 0;
			userStats.topicStats[topicKey].lastPlayed = new Date();

			// Update difficulty stats
			const difficultyKey = gameData.difficulty;
			if (!userStats.difficultyStats[difficultyKey]) {
				userStats.difficultyStats[difficultyKey] = {
					totalQuestions: 0,
					correctAnswers: 0,
					successRate: 0,
					lastPlayed: new Date(),
				};
			}
			userStats.difficultyStats[difficultyKey].totalQuestions += gameData.totalQuestions;
			userStats.difficultyStats[difficultyKey].correctAnswers += gameData.correctAnswers;
			userStats.difficultyStats[difficultyKey].successRate =
				userStats.difficultyStats[difficultyKey].totalQuestions > 0
					? (userStats.difficultyStats[difficultyKey].correctAnswers /
							userStats.difficultyStats[difficultyKey].totalQuestions) *
						100
					: 0;
			userStats.difficultyStats[difficultyKey].lastPlayed = new Date();

			// Update last play date
			userStats.lastPlayDate = new Date();

			await this.userStatsRepository.save(userStats);

			// Clear cache
			await this.cacheService.delete(`user:stats:${userId}`);

			logger.analyticsTrack('User stats updated after game', {
				userId,
				totalGames: userStats.totalGames,
				totalQuestions: userStats.totalQuestions,
				successRate: userStats.overallSuccessRate,
			});
		} catch (error) {
			logger.analyticsError('updateUserStatsAfterGame', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Calculate and update streaks
	 * @param userId User ID
	 */
	async updateStreaks(userId: string): Promise<void> {
		try {
			const userStats = await this.getUserStats(userId);
			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: 30, // Last 30 games for streak calculation
			});

			const streakData = this.calculateStreak(gameHistory);
			userStats.currentStreak = streakData.current;
			userStats.longestStreak = Math.max(userStats.longestStreak, streakData.longest);
			userStats.consecutiveDaysPlayed = streakData.consecutiveDays;

			await this.userStatsRepository.save(userStats);
			await this.cacheService.delete(`user:stats:${userId}`);
		} catch (error) {
			logger.analyticsError('updateStreaks', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Calculate streak from game history
	 * @param gameHistory Array of game history records
	 * @returns Streak data
	 */
	private calculateStreak(gameHistory: GameHistoryEntity[]): {
		current: number;
		longest: number;
		consecutiveDays: number;
	} {
		if (gameHistory.length === 0) {
			return { current: 0, longest: 0, consecutiveDays: 0 };
		}

		let currentStreak = 0;
		let longestStreak = 0;
		let consecutiveDays = 0;
		let lastDate: Date | null = null;

		for (const game of gameHistory) {
			const gameDate = new Date(game.createdAt);
			const gameDateStr = gameDate.toDateString();

			if (!lastDate || lastDate.toDateString() === gameDateStr) {
				currentStreak++;
			} else {
				longestStreak = Math.max(longestStreak, currentStreak);
				currentStreak = 1;
			}

			// Calculate consecutive days
			if (!lastDate || this.isConsecutiveDay(lastDate, gameDate)) {
				consecutiveDays++;
			} else {
				consecutiveDays = 1;
			}

			lastDate = gameDate;
		}

		longestStreak = Math.max(longestStreak, currentStreak);

		return {
			current: currentStreak,
			longest: longestStreak,
			consecutiveDays,
		};
	}

	/**
	 * Check if two dates are consecutive days
	 * @param date1 First date
	 * @param date2 Second date
	 * @returns True if consecutive
	 */
	private isConsecutiveDay(date1: Date, date2: Date): boolean {
		const diffTime = Math.abs(date2.getTime() - date1.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays === 1;
	}

	/**
	 * Get user performance metrics
	 * @param userId User ID
	 * @returns Performance metrics
	 */
	async getUserPerformanceMetrics(userId: string): Promise<{
		averageTimePerQuestion: number;
		totalPlayTime: number;
		bestGameScore: number;
		bestGameDate?: Date;
		successRate: number;
		totalGames: number;
	}> {
		try {
			const userStats = await this.getUserStats(userId);

			return {
				averageTimePerQuestion: userStats.averageTimePerQuestion,
				totalPlayTime: userStats.totalPlayTime,
				bestGameScore: userStats.bestGameScore,
				bestGameDate: userStats.bestGameDate,
				successRate: userStats.overallSuccessRate,
				totalGames: userStats.totalGames,
			};
		} catch (error) {
			logger.analyticsError('getUserPerformanceMetrics', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}
}
