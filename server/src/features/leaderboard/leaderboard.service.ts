import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { serverLogger as logger } from '@shared/services';
import { createNotFoundError } from '@internal/utils';
import { getErrorMessage } from '@shared/utils';
import { CACHE_DURATION } from '@shared/constants';
import { GameHistoryEntity, LeaderboardEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';
import { CacheService } from 'src/internal/modules/cache';
import { Repository } from 'typeorm';

/**
 * Leaderboard Service
 *
 * @service LeaderboardService
 * @description Service for managing user rankings and leaderboard calculations
 * @used_by server/src/features/leaderboard/leaderboard.controller.ts
 */
@Injectable()
export class LeaderboardService {
	constructor(
		@InjectRepository(LeaderboardEntity)
		private readonly leaderboardRepository: Repository<LeaderboardEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepository: Repository<UserStatsEntity>,
		private readonly cacheService: CacheService
	) {}

	/**
	 * Update user ranking
	 * @param userId User ID
	 * @returns Updated ranking data
	 */
	async updateUserRanking(userId: string): Promise<LeaderboardEntity> {
		try {
			logger.analyticsTrack('Updating user ranking', { userId });

			// Get user data
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

		// Get game history for calculations
		const gameHistory = await this.gameHistoryRepository.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});

		// Get or create user stats
		let userStats = await this.userStatsRepository.findOne({
			where: { userId },
		});

		if (!userStats) {
			userStats = this.userStatsRepository.create({
				userId,
			});
		}

		// Calculate user statistics
		const calculatedStats = this.calculateUserStats(gameHistory, user);
		Object.assign(userStats, calculatedStats);
		await this.userStatsRepository.save(userStats);

		// Get or create leaderboard entry
		let leaderboardEntry = await this.leaderboardRepository.findOne({
			where: { userId },
		});

		if (!leaderboardEntry) {
			leaderboardEntry = this.leaderboardRepository.create({
				userId,
				userStatsId: userStats.id,
				score: calculatedStats.score,
			});
		} else {
			leaderboardEntry.userStatsId = userStats.id;
			leaderboardEntry.score = calculatedStats.score;
		}

			// Save the entry
			const savedEntry = await this.leaderboardRepository.save(leaderboardEntry);

			// Update global rankings
			await this.updateGlobalRankings();

			// Clear cache
			await this.cacheService.delete(`leaderboard:user:${userId}`);
			await this.cacheService.delete('leaderboard:global');

			return savedEntry;
		} catch (error) {
			logger.analyticsError('updateUserRanking', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user ranking
	 * @param userId User ID
	 * @returns User ranking data
	 */
	async getUserRanking(userId: string): Promise<LeaderboardEntity | null> {
		try {
			const cacheKey = `leaderboard:user:${userId}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const ranking = await this.leaderboardRepository.findOne({
						where: { userId },
						relations: ['user', 'userStats'],
					});

					return ranking;
				},
				CACHE_DURATION.MEDIUM // Cache for 5 minutes
			);
		} catch (error) {
			logger.analyticsError('getUserRanking', {
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
	async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntity[]> {
		try {
			const cacheKey = `leaderboard:global:${limit}:${offset}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const leaderboard = await this.leaderboardRepository.find({
						relations: ['user', 'userStats'],
						order: { score: 'DESC' },
						take: limit,
						skip: offset,
					});

					return leaderboard;
				},
				CACHE_DURATION.LONG // Cache for 10 minutes
			);
		} catch (error) {
			logger.analyticsError('getGlobalLeaderboard', {
				error: getErrorMessage(error),
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
	async getLeaderboardByPeriod(
		period: 'weekly' | 'monthly' | 'yearly',
		limit: number = 100
	): Promise<LeaderboardEntity[]> {
		try {
			const cacheKey = `leaderboard:${period}:${limit}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const scoreField = `${period}Score` as keyof UserStatsEntity;

					const leaderboard = await this.leaderboardRepository
						.createQueryBuilder('leaderboard')
						.leftJoinAndSelect('leaderboard.user', 'user')
						.leftJoinAndSelect('leaderboard.userStats', 'userStats')
						.orderBy(`userStats.${scoreField}`, 'DESC')
						.limit(limit)
						.getMany();

					return leaderboard;
				},
				CACHE_DURATION.LONG // Cache for 10 minutes
			);
		} catch (error) {
			logger.analyticsError('getLeaderboardByPeriod', {
				error: getErrorMessage(error),
				period,
			});
			throw error;
		}
	}

	/**
	 * Get user percentile
	 * @param userId User ID
	 * @returns User percentile
	 */
	async getUserPercentile(userId: string): Promise<number> {
		try {
			const userRanking = await this.getUserRanking(userId);
			if (!userRanking) {
				return 0;
			}

			const totalUsers = await this.leaderboardRepository.count();
			if (totalUsers === 0) {
				return 0;
			}

			const percentile = Math.round(((totalUsers - userRanking.rank + 1) / totalUsers) * 100);
			return Math.min(100, Math.max(0, percentile));
		} catch (error) {
			logger.analyticsError('getUserPercentile', {
				error: getErrorMessage(error),
				userId,
			});
			return 0;
		}
	}

	/**
	 * Calculate user statistics from game history
	 * @param gameHistory Array of game history records
	 * @param user User entity
	 * @returns Calculated user statistics
	 */
	private calculateUserStats(gameHistory: GameHistoryEntity[], user: UserEntity) {
		const totalGames = gameHistory.length;
		const totalQuestions = gameHistory.reduce((sum, game) => sum + game.totalQuestions, 0);
		const correctAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
		const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

		// Calculate streak
		const streakData = this.calculateStreak(gameHistory);

		// Calculate time-based scores
		const timeScores = this.calculateTimeBasedScores(gameHistory);

		// Calculate topic and difficulty stats
		const topicStats = this.calculateTopicStats(gameHistory);
		const difficultyStats = this.calculateDifficultyStats(gameHistory);

		// Calculate total score (weighted combination)
		const totalScore = this.calculateTotalScore(user, gameHistory, successRate, streakData);

		return {
			totalGames,
			totalQuestions,
			correctAnswers,
			incorrectAnswers: totalQuestions - correctAnswers,
			overallSuccessRate: successRate,
			currentStreak: streakData.current,
			longestStreak: streakData.best,
			lastPlayDate: gameHistory[0]?.createdAt,
			weeklyScore: timeScores.weekly,
			monthlyScore: timeScores.monthly,
			yearlyScore: timeScores.yearly,
			topicStats,
			difficultyStats,
			score: totalScore,
		};
	}

	/**
	 * Calculate streak from game history
	 * @param gameHistory Array of game history records
	 * @returns Streak data
	 */
	private calculateStreak(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length === 0) {
			return { current: 0, best: 0 };
		}

		// Sort by date (newest first)
		const sortedHistory = [...gameHistory].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

		let currentStreak = 0;
		let bestStreak = 0;
		let tempStreak = 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 0; i < sortedHistory.length; i++) {
			const gameDate = new Date(sortedHistory[i].createdAt);
			gameDate.setHours(0, 0, 0, 0);

			const expectedDate = new Date(today);
			expectedDate.setDate(expectedDate.getDate() - i);

			if (gameDate.getTime() === expectedDate.getTime()) {
				tempStreak++;
				if (i === 0) {
					currentStreak = tempStreak;
				}
			} else {
				bestStreak = Math.max(bestStreak, tempStreak);
				tempStreak = 0;
			}
		}

		bestStreak = Math.max(bestStreak, tempStreak);

		return { current: currentStreak, best: bestStreak };
	}

	/**
	 * Calculate time-based scores
	 * @param gameHistory Array of game history records
	 * @returns Time-based scores
	 */
	private calculateTimeBasedScores(gameHistory: GameHistoryEntity[]) {
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

		const weeklyGames = gameHistory.filter(game => game.createdAt >= oneWeekAgo);
		const monthlyGames = gameHistory.filter(game => game.createdAt >= oneMonthAgo);
		const yearlyGames = gameHistory.filter(game => game.createdAt >= oneYearAgo);

		return {
			weekly: weeklyGames.reduce((sum, game) => sum + game.score, 0),
			monthly: monthlyGames.reduce((sum, game) => sum + game.score, 0),
			yearly: yearlyGames.reduce((sum, game) => sum + game.score, 0),
		};
	}

	/**
	 * Calculate topic statistics
	 * @param gameHistory Array of game history records
	 * @returns Topic statistics
	 */
	private calculateTopicStats(gameHistory: GameHistoryEntity[]) {
		const topicStats: Record<
			string,
			{ totalQuestions: number; correctAnswers: number; successRate: number; score: number }
		> = {};

		gameHistory.forEach(game => {
			const topic = game.topic || 'Unknown';
			if (!topicStats[topic]) {
				topicStats[topic] = { totalQuestions: 0, correctAnswers: 0, successRate: 0, score: 0 };
			}
			topicStats[topic].totalQuestions += game.totalQuestions;
			topicStats[topic].correctAnswers += game.correctAnswers;
			topicStats[topic].score += game.score;
		});

		// Calculate success rates
		Object.keys(topicStats).forEach(topic => {
			const stats = topicStats[topic];
			stats.successRate = stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0;
		});

		return topicStats;
	}

	/**
	 * Calculate difficulty statistics
	 * @param gameHistory Array of game history records
	 * @returns Difficulty statistics
	 */
	private calculateDifficultyStats(gameHistory: GameHistoryEntity[]) {
		const difficultyStats: Record<
			string,
			{ totalQuestions: number; correctAnswers: number; successRate: number; score: number }
		> = {};

		gameHistory.forEach(game => {
			const difficulty = game.difficulty || 'Unknown';
			if (!difficultyStats[difficulty]) {
				difficultyStats[difficulty] = { totalQuestions: 0, correctAnswers: 0, successRate: 0, score: 0 };
			}
			difficultyStats[difficulty].totalQuestions += game.totalQuestions;
			difficultyStats[difficulty].correctAnswers += game.correctAnswers;
			difficultyStats[difficulty].score += game.score;
		});

		// Calculate success rates
		Object.keys(difficultyStats).forEach(difficulty => {
			const stats = difficultyStats[difficulty];
			stats.successRate = stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0;
		});

		return difficultyStats;
	}

	/**
	 * Calculate total score
	 * @param user User entity
	 * @param gameHistory Array of game history records
	 * @param successRate Success rate percentage
	 * @param streakData Streak data
	 * @returns Total calculated score
	 */
	private calculateTotalScore(
		user: UserEntity,
		gameHistory: GameHistoryEntity[],
		successRate: number,
		streakData: { current: number; best: number }
	) {
		// Base score from user credits and purchased points
		const baseScore = user.credits + user.purchasedPoints;

		// Game performance score
		const totalGameScore = gameHistory.reduce((sum, game) => sum + game.score, 0);

		// Success rate bonus (up to 1000 points)
		const successRateBonus = Math.min(1000, successRate * 10);

		// Streak bonus (up to 500 points)
		const streakBonus = Math.min(500, streakData.current * 10 + streakData.best * 5);

		// Total questions bonus (up to 200 points)
		const totalQuestions = gameHistory.reduce((sum, game) => sum + game.totalQuestions, 0);
		const questionsBonus = Math.min(200, totalQuestions * 2);

		return baseScore + totalGameScore + successRateBonus + streakBonus + questionsBonus;
	}

	/**
	 * Update global rankings
	 */
	private async updateGlobalRankings() {
		try {
			// Get all leaderboard entries ordered by score
			const entries = await this.leaderboardRepository.find({
				order: { score: 'DESC' },
			});

			// Update ranks
			for (let i = 0; i < entries.length; i++) {
				entries[i].rank = i + 1;
				entries[i].totalUsers = entries.length;
				entries[i].percentile = Math.round(((entries.length - i) / entries.length) * 100);
				entries[i].lastRankUpdate = new Date();
			}

			// Save all updates
			await this.leaderboardRepository.save(entries);

			logger.analyticsTrack('Global rankings updated', {
				totalUsers: entries.length,
			});
		} catch (error) {
			logger.analyticsError('updateGlobalRankings', {
				error: getErrorMessage(error),
			});
		}
	}
}
