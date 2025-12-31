import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CACHE_DURATION, LeaderboardPeriod, TIME_PERIODS_MS } from '@shared/constants';
import type { CategoryStatistics, ClearOperationResponse, LeaderboardStats } from '@shared/types';
import { getErrorMessage, groupBy, isRecord } from '@shared/utils';
import { GameHistoryEntity, LeaderboardEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { StreakData } from '@internal/types';
import { createNotFoundError } from '@internal/utils';
import { addDateRangeConditions } from '../../common/queries';

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
			const calculatedStats = this.calculateUserStats(gameHistory);
			Object.assign(userStats, calculatedStats);
			await this.userStatsRepository.save(userStats);

			// Calculate total score for leaderboard (not part of UserStatsEntity)
			const totalScore = this.calculateTotalScore(user, gameHistory, calculatedStats.overallSuccessRate, {
				current: calculatedStats.currentStreak,
				best: calculatedStats.longestStreak,
			});

			// Get or create leaderboard entry
			let leaderboardEntry = await this.leaderboardRepository.findOne({
				where: { userId },
			});

			if (!leaderboardEntry) {
				leaderboardEntry = this.leaderboardRepository.create({
					userId,
					userStatsId: userStats.id,
					score: totalScore,
				});
			} else {
				leaderboardEntry.userStatsId = userStats.id;
				leaderboardEntry.score = totalScore;
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

			return await this.cacheService.getOrSet<LeaderboardEntity | null>(
				cacheKey,
				async () => {
					try {
						const ranking = await this.leaderboardRepository.findOne({
							where: { userId },
							relations: ['user', 'userStats'],
						});

						return ranking;
					} catch (dbError) {
						logger.analyticsError('Database error in getUserRanking', {
							error: getErrorMessage(dbError),
							userId,
						});
						throw dbError;
					}
				},
				CACHE_DURATION.MEDIUM
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

			return await this.cacheService.getOrSet<LeaderboardEntity[]>(
				cacheKey,
				async () => {
					try {
						const leaderboard = await this.leaderboardRepository.find({
							relations: ['user', 'userStats'],
							order: { score: 'DESC' },
							take: limit,
							skip: offset,
						});

						return leaderboard;
					} catch (dbError) {
						logger.analyticsError('Database error in getGlobalLeaderboard', {
							error: getErrorMessage(dbError),
							limit,
							offset,
						});
						throw dbError;
					}
				},
				CACHE_DURATION.LONG
			);
		} catch (error) {
			logger.analyticsError('getGlobalLeaderboard', {
				error: getErrorMessage(error),
				limit,
				offset,
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
	async getLeaderboardByPeriod(period: LeaderboardPeriod, limit: number = 100): Promise<LeaderboardEntity[]> {
		try {
			const cacheKey = `leaderboard:${period}:${limit}`;

			return await this.cacheService.getOrSet<LeaderboardEntity[]>(
				cacheKey,
				async () => {
					try {
						// Type-safe mapping for period to score field
						const scoreFieldMap: Record<LeaderboardPeriod, keyof UserStatsEntity> = {
							[LeaderboardPeriod.WEEKLY]: 'weeklyScore',
							[LeaderboardPeriod.MONTHLY]: 'monthlyScore',
							[LeaderboardPeriod.YEARLY]: 'yearlyScore',
							[LeaderboardPeriod.GLOBAL]: 'weeklyScore', // fallback
						};

						const scoreField = scoreFieldMap[period];
						if (!scoreField) {
							throw new Error(`Invalid period: ${period}. Valid periods are: weekly, monthly, yearly`);
						}

						const leaderboard = await this.leaderboardRepository
							.createQueryBuilder('leaderboard')
							.leftJoinAndSelect('leaderboard.user', 'user')
							.leftJoinAndSelect('leaderboard.userStats', 'userStats')
							.orderBy(`userStats.${scoreField}`, 'DESC')
							.limit(limit)
							.getMany();

						return leaderboard;
					} catch (dbError) {
						logger.analyticsError('Database error in getLeaderboardByPeriod', {
							error: getErrorMessage(dbError),
							period,
							limit,
						});
						throw dbError;
					}
				},
				CACHE_DURATION.LONG
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
	 * Calculate user statistics from game history
	 * @param gameHistory Array of game history records
	 * @returns Calculated user statistics
	 */
	private calculateUserStats(gameHistory: GameHistoryEntity[]) {
		const totalGames = gameHistory.length;
		const totalQuestionsAnswered = gameHistory.reduce((sum, game) => sum + game.gameQuestionCount, 0);
		const correctAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
		const successRate = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;

		// Calculate best game score (highest score from all games)
		const bestGameScore = gameHistory.length > 0 ? Math.max(...gameHistory.map(game => game.score)) : 0;

		// Calculate streak
		const streakData = this.calculateStreak(gameHistory);

		// Calculate time-based scores
		const timeScores = this.calculateTimeBasedScores(gameHistory);

		// Calculate topic and difficulty stats
		const topicStats = this.calculateTopicStats(gameHistory);
		const difficultyStats = this.calculateDifficultyStats(gameHistory);

		return {
			totalGames,
			totalQuestionsAnswered,
			correctAnswers,
			incorrectAnswers: totalQuestionsAnswered - correctAnswers,
			overallSuccessRate: successRate,
			currentStreak: streakData.current,
			longestStreak: streakData.best,
			lastPlayDate: gameHistory[0]?.createdAt,
			weeklyScore: timeScores.weekly,
			monthlyScore: timeScores.monthly,
			yearlyScore: timeScores.yearly,
			bestGameScore,
			topicStats,
			difficultyStats,
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
			const game = sortedHistory[i];
			if (game == null) {
				break;
			}
			const gameDate = new Date(game.createdAt);
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
		const oneWeekAgo = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
		const oneMonthAgo = new Date(now.getTime() - TIME_PERIODS_MS.MONTH);
		const oneYearAgo = new Date(now.getTime() - TIME_PERIODS_MS.YEAR);

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
		const groupedByTopic = groupBy(gameHistory, 'topic');
		const topicStats: Record<string, CategoryStatistics> = {};

		Object.entries(groupedByTopic).forEach(([topic, games]) => {
			const totalQuestionsAnswered = games.reduce((sum, game) => sum + game.gameQuestionCount, 0);
			const correctAnswers = games.reduce((sum, game) => sum + game.correctAnswers, 0);
			const score = games.reduce((sum, game) => sum + game.score, 0);
			const lastPlayed = games.reduce((latest, game) => {
				const gameDate = new Date(game.createdAt);
				const latestDate = new Date(latest);
				return gameDate > latestDate ? gameDate : latestDate;
			}, new Date(0));

			topicStats[topic] = {
				totalQuestionsAnswered,
				correctAnswers,
				score,
				successRate: totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0,
				lastPlayed,
			};
		});

		return topicStats;
	}

	/**
	 * Calculate difficulty statistics
	 * @param gameHistory Array of game history records
	 * @returns Difficulty statistics
	 */
	private calculateDifficultyStats(gameHistory: GameHistoryEntity[]) {
		const groupedByDifficulty = groupBy(gameHistory, 'difficulty');
		const difficultyStats: Record<string, CategoryStatistics> = {};

		Object.entries(groupedByDifficulty).forEach(([difficulty, games]) => {
			const totalQuestionsAnswered = games.reduce((sum, game) => sum + game.gameQuestionCount, 0);
			const correctAnswers = games.reduce((sum, game) => sum + game.correctAnswers, 0);
			const score = games.reduce((sum, game) => sum + game.score, 0);
			const lastPlayed = games.reduce((latest, game) => {
				const gameDate = new Date(game.createdAt);
				const latestDate = new Date(latest);
				return gameDate > latestDate ? gameDate : latestDate;
			}, new Date(0));

			difficultyStats[difficulty] = {
				totalQuestionsAnswered,
				correctAnswers,
				score,
				successRate: totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0,
				lastPlayed,
			};
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
		streakData: StreakData
	) {
		// Credits contribution to score (user credits and purchased credits)
		const creditsContribution = user.credits + user.purchasedCredits;

		// Game performance score
		const totalGameScore = gameHistory.reduce((sum, game) => sum + game.score, 0);

		// Success rate bonus (up to 1000 scoring)
		const successRateBonus = Math.min(1000, successRate * 10);

		// Streak bonus (up to 500 scoring)
		const streakBonus = Math.min(500, streakData.current * 10 + streakData.best * 5);

		// Total questions bonus (up to 200 scoring)
		const totalQuestionsAnswered = gameHistory.reduce((sum, game) => sum + game.gameQuestionCount, 0);
		const questionsBonus = Math.min(200, totalQuestionsAnswered * 2);

		return creditsContribution + totalGameScore + successRateBonus + streakBonus + questionsBonus;
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
				const entry = entries[i];
				if (entry != null) {
					entry.rank = i + 1;
					entry.totalUsers = entries.length;
					entry.percentile = Math.round(((entries.length - i) / entries.length) * 100);
					entry.lastRankUpdate = new Date();
				}
			}

		// Save all updates
		await this.leaderboardRepository.save(entries);
	} catch (error) {
			logger.analyticsError('updateGlobalRankings', {
				error: getErrorMessage(error),
			});
		}
	}

	/**
	 * Get leaderboard statistics for a specific period
	 * @param period Time period (weekly, monthly, yearly)
	 * @returns Leaderboard statistics
	 */
	async getLeaderboardStats(period: LeaderboardPeriod): Promise<LeaderboardStats> {
		try {
			const cacheKey = `leaderboard:stats:${period}`;

			return await this.cacheService.getOrSet<LeaderboardStats>(
				cacheKey,
				async () => {
					// Calculate date range based on period
					const now = new Date();
					let startDate: Date;

					switch (period) {
						case LeaderboardPeriod.WEEKLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
							break;
						case LeaderboardPeriod.MONTHLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.MONTH);
							break;
						case LeaderboardPeriod.YEARLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.YEAR);
							break;
						default:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
					}

					// Get active users (users who played games in the period)
					const activeUsersQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'count');
					addDateRangeConditions(activeUsersQueryBuilder, 'game', 'createdAt', startDate);
					const activeUsersRaw = await activeUsersQueryBuilder.getRawOne<{ count: number }>();

					const activeUsers = activeUsersRaw?.count ?? 0;

					// Get average scoring from leaderboard entries for the period
					const scoreFieldMap: Record<LeaderboardPeriod, keyof UserStatsEntity> = {
						[LeaderboardPeriod.WEEKLY]: 'weeklyScore',
						[LeaderboardPeriod.MONTHLY]: 'monthlyScore',
						[LeaderboardPeriod.YEARLY]: 'yearlyScore',
						[LeaderboardPeriod.GLOBAL]: 'weeklyScore', // fallback
					};

					const scoreField = scoreFieldMap[period];
					if (!scoreField) {
						throw new Error(`Invalid period: ${period}`);
					}

					const averageScoreRaw = await this.leaderboardRepository
						.createQueryBuilder('leaderboard')
						.leftJoin('leaderboard.userStats', 'userStats')
						.select(`CAST(AVG(userStats.${scoreField}) AS DOUBLE PRECISION)`, 'average')
						.where(`userStats.${scoreField} > 0`)
						.getRawOne<{ average: number | null }>();

					const averageScore = averageScoreRaw?.average ? Math.round(averageScoreRaw.average) : 0;

					// Get average games played in the period
					const averageGamesQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(*) AS DOUBLE PRECISION)', 'total')
						.addSelect('CAST(COUNT(DISTINCT game.userId) AS DOUBLE PRECISION)', 'users');
					addDateRangeConditions(averageGamesQueryBuilder, 'game', 'createdAt', startDate);
					const averageGamesRaw = await averageGamesQueryBuilder.getRawOne<{
						total: number | null;
						users: number | null;
					}>();

					const totalGames = averageGamesRaw?.total ?? 0;
					const uniqueUsers = averageGamesRaw?.users ?? 0;
					const averageGames = uniqueUsers > 0 ? Math.round(totalGames / uniqueUsers) : 0;

					return {
						activeUsers,
						averageScore,
						averageGames,
					};
				},
				CACHE_DURATION.MEDIUM,
				(data): data is LeaderboardStats => {
					if (!isRecord(data)) {
						return false;
					}
					return (
						typeof data.activeUsers === 'number' &&
						Number.isFinite(data.activeUsers) &&
						typeof data.averageScore === 'number' &&
						Number.isFinite(data.averageScore) &&
						typeof data.averageGames === 'number' &&
						Number.isFinite(data.averageGames)
					);
				}
			);
		} catch (error) {
			logger.analyticsError('getLeaderboardStats', {
				error: getErrorMessage(error),
				period,
			});
			throw error;
		}
	}

	/**
	 * Clear all leaderboard entries (admin)
	 */
	async clearAllLeaderboard(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.leaderboardRepository.count();

		if (totalBefore === 0) {
			// Clear cache even if no records found
				try {
					await this.cacheService.invalidatePattern('leaderboard:*');
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', 'leaderboard:*', {
						error: getErrorMessage(cacheError),
					});
				}
				return {
					success: true,
					message: 'No leaderboard records found',
					deletedCount: 0,
				};
			}

		await this.leaderboardRepository.clear();
		const deletedCount = totalBefore;

		// Clear cache after database deletion
			try {
				const cacheDeleted = await this.cacheService.invalidatePattern('leaderboard:*');
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Leaderboard cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', 'leaderboard:*', {
					error: getErrorMessage(cacheError),
				});
				// Don't throw - database deletion was successful
			}

			return {
				success: true,
				message: 'All leaderboard records removed successfully',
				deletedCount,
			};
		} catch (error) {
			logger.analyticsError('Failed to clear all leaderboard', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
