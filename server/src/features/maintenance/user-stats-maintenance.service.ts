import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateSuccessRate, getErrorMessage } from '@shared/utils';

import { GameHistoryEntity, UserStatsEntity } from '@internal/entities';
import { CacheInvalidationService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import { calculateCategoryStats } from '@internal/utils';

import { UserStatsUpdateService } from '../analytics/services/user-stats-update.service';

@Injectable()
export class UserStatsMaintenanceService {
	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepo: Repository<GameHistoryEntity>,
		private readonly userStatsUpdateService: UserStatsUpdateService,
		private readonly cacheInvalidationService: CacheInvalidationService
	) {}

	async recalculateStatsFromHistory(userId: string): Promise<void> {
		try {
			const gameHistory = await this.gameHistoryRepo.find({
				where: { userId },
				order: { createdAt: 'ASC' },
			});

			let userStats = await this.userStatsRepo.findOne({
				where: { userId },
			});

			if (!userStats) {
				userStats = await this.userStatsUpdateService.initializeUserStats(userId);
			}

			if (gameHistory.length === 0) {
				await this.userStatsUpdateService.resetUserStats(userId);
				return;
			}

			this.recalculateBasicStats(userStats, gameHistory);
			this.recalculateCategoryStats(userStats, gameHistory);

			const streakData = await this.userStatsUpdateService.calculateStreaksFromHistory(userId);
			userStats.currentStreak = streakData.current;
			userStats.longestStreak = Math.max(userStats.longestStreak, streakData.best);

			const timeBasedScores = this.userStatsUpdateService.calculateTimeBasedScoresFromHistory(gameHistory);
			userStats.weeklyScore = timeBasedScores.weeklyScore;
			userStats.monthlyScore = timeBasedScores.monthlyScore;
			userStats.yearlyScore = timeBasedScores.yearlyScore;

			const timeStats = this.userStatsUpdateService.calculateTimeStatsFromHistory(
				gameHistory,
				userStats.totalQuestionsAnswered
			);
			userStats.totalPlayTime = timeStats.totalPlayTime;
			userStats.averageTimePerQuestion = timeStats.averageTimePerQuestion;

			const bestGame = this.userStatsUpdateService.calculateBestGameScoreFromHistory(gameHistory);
			userStats.bestGameScore = bestGame.bestGameScore;
			userStats.bestGameDate = bestGame.bestGameDate;

			await this.userStatsRepo.save(userStats);

			await this.cacheInvalidationService.invalidateOnAnalyticsUpdate(userId);

			logger.analyticsStats('user_stats_recalculated', {
				userId,
				count: gameHistory.length,
			});
		} catch (error) {
			logger.analyticsError('recalculateStatsFromHistory', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async checkConsistency(userId: string): Promise<{
		isConsistent: boolean;
		discrepancies: {
			totalGames: { expected: number; actual: number };
			totalQuestionsAnswered: { expected: number; actual: number };
			correctAnswers: { expected: number; actual: number };
			totalScore: { expected: number; actual: number };
			successRate: { expected: number; actual: number };
			bestGameScore: { expected: number; actual: number };
			lastPlayDate: { expected: Date | null; actual: Date | null };
			topicStats: { inconsistent: string[] };
			difficultyStats: { inconsistent: string[] };
		};
	}> {
		try {
			const gameHistory = await this.gameHistoryRepo.find({
				where: { userId },
				order: { createdAt: 'ASC' },
			});

			const userStats = await this.userStatsRepo.findOne({
				where: { userId },
			});

			if (!userStats) {
				const expectedTotalQuestionsAnswered = gameHistory.reduce((sum, game) => sum + game.gameQuestionCount, 0);
				const expectedCorrectAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
				const expectedSuccessRate =
					expectedTotalQuestionsAnswered > 0
						? calculateSuccessRate(expectedTotalQuestionsAnswered, expectedCorrectAnswers)
						: 0;
				const expectedBestScore = gameHistory.length > 0 ? Math.max(...gameHistory.map(game => game.score ?? 0)) : 0;
				const expectedLastPlayDate =
					gameHistory.length > 0 ? (gameHistory[gameHistory.length - 1]?.createdAt ?? null) : null;

				return {
					isConsistent: gameHistory.length === 0,
					discrepancies: {
						totalGames: { expected: gameHistory.length, actual: 0 },
						totalQuestionsAnswered: {
							expected: expectedTotalQuestionsAnswered,
							actual: 0,
						},
						correctAnswers: {
							expected: expectedCorrectAnswers,
							actual: 0,
						},
						totalScore: {
							expected: gameHistory.reduce((sum, game) => sum + (game.score ?? 0), 0),
							actual: 0,
						},
						successRate: {
							expected: expectedSuccessRate,
							actual: 0,
						},
						bestGameScore: {
							expected: expectedBestScore,
							actual: 0,
						},
						lastPlayDate: {
							expected: expectedLastPlayDate,
							actual: null,
						},
						topicStats: { inconsistent: [] },
						difficultyStats: { inconsistent: [] },
					},
				};
			}

			const expectedTotalGames = gameHistory.length;
			const expectedTotalQuestionsAnswered = gameHistory.reduce((sum, game) => sum + game.gameQuestionCount, 0);
			const expectedCorrectAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
			const expectedTotalScore = gameHistory.reduce((sum, game) => sum + (game.score ?? 0), 0);
			const expectedSuccessRate =
				expectedTotalQuestionsAnswered > 0
					? calculateSuccessRate(expectedTotalQuestionsAnswered, expectedCorrectAnswers)
					: 0;
			const expectedBestScore = gameHistory.length > 0 ? Math.max(...gameHistory.map(game => game.score ?? 0)) : 0;
			const expectedLastPlayDate =
				gameHistory.length > 0 ? (gameHistory[gameHistory.length - 1]?.createdAt ?? null) : null;

			// Check topic stats consistency
			const topicStatsInconsistent: string[] = [];
			if (userStats.topicStats) {
				for (const [topic, stats] of Object.entries(userStats.topicStats)) {
					const topicGames = gameHistory.filter(game => game.topic === topic);
					const expectedTopicQuestions = topicGames.reduce((sum, game) => sum + game.gameQuestionCount, 0);
					const expectedTopicCorrect = topicGames.reduce((sum, game) => sum + game.correctAnswers, 0);

					if (
						stats.totalQuestionsAnswered !== expectedTopicQuestions ||
						stats.correctAnswers !== expectedTopicCorrect
					) {
						topicStatsInconsistent.push(topic);
					}
				}
			}

			// Check difficulty stats consistency
			const difficultyStatsInconsistent: string[] = [];
			if (userStats.difficultyStats) {
				for (const [difficulty, stats] of Object.entries(userStats.difficultyStats)) {
					const difficultyGames = gameHistory.filter(game => game.difficulty === difficulty);
					const expectedDifficultyQuestions = difficultyGames.reduce((sum, game) => sum + game.gameQuestionCount, 0);
					const expectedDifficultyCorrect = difficultyGames.reduce((sum, game) => sum + game.correctAnswers, 0);

					if (
						stats.totalQuestionsAnswered !== expectedDifficultyQuestions ||
						stats.correctAnswers !== expectedDifficultyCorrect
					) {
						difficultyStatsInconsistent.push(difficulty);
					}
				}
			}

			const discrepancies = {
				totalGames: { expected: expectedTotalGames, actual: userStats.totalGames },
				totalQuestionsAnswered: {
					expected: expectedTotalQuestionsAnswered,
					actual: userStats.totalQuestionsAnswered,
				},
				correctAnswers: {
					expected: expectedCorrectAnswers,
					actual: userStats.correctAnswers,
				},
				totalScore: {
					expected: expectedTotalScore,
					actual: userStats.totalScore ?? 0,
				},
				successRate: {
					expected: expectedSuccessRate,
					actual: userStats.overallSuccessRate ?? 0,
				},
				bestGameScore: {
					expected: expectedBestScore,
					actual: userStats.bestGameScore ?? 0,
				},
				lastPlayDate: {
					expected: expectedLastPlayDate,
					actual: userStats.lastPlayDate ?? null,
				},
				topicStats: { inconsistent: topicStatsInconsistent },
				difficultyStats: { inconsistent: difficultyStatsInconsistent },
			};

			const isConsistent =
				discrepancies.totalGames.expected === discrepancies.totalGames.actual &&
				discrepancies.totalQuestionsAnswered.expected === discrepancies.totalQuestionsAnswered.actual &&
				discrepancies.correctAnswers.expected === discrepancies.correctAnswers.actual &&
				discrepancies.totalScore.expected === discrepancies.totalScore.actual &&
				discrepancies.successRate.expected === discrepancies.successRate.actual &&
				discrepancies.bestGameScore.expected === discrepancies.bestGameScore.actual &&
				discrepancies.topicStats.inconsistent.length === 0 &&
				discrepancies.difficultyStats.inconsistent.length === 0;

			return {
				isConsistent,
				discrepancies,
			};
		} catch (error) {
			logger.analyticsError('checkConsistency', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async fixConsistency(userId: string): Promise<{ fixed: boolean; message: string }> {
		try {
			const consistency = await this.checkConsistency(userId);

			if (consistency.isConsistent) {
				return {
					fixed: false,
					message: 'User stats are already consistent with game history',
				};
			}

			await this.recalculateStatsFromHistory(userId);

			logger.analyticsStats('user_stats_consistency_fixed', {
				userId,
				discrepancies: consistency.discrepancies,
			});

			return {
				fixed: true,
				message: 'User stats have been recalculated from game history to fix inconsistencies',
			};
		} catch (error) {
			logger.analyticsError('fixConsistency', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async checkAllUsersConsistency(): Promise<{
		totalUsers: number;
		usersWithGames: number;
		consistentUsers: number;
		inconsistentUsers: number;
		results: Array<{
			userId: string;
			isConsistent: boolean;
			discrepancies: {
				totalGames: { expected: number; actual: number };
				totalQuestionsAnswered: { expected: number; actual: number };
				correctAnswers: { expected: number; actual: number };
				totalScore: { expected: number; actual: number };
			};
		}>;
	}> {
		try {
			// Get all unique user IDs from game_history
			const usersWithGamesRaw = await this.gameHistoryRepo
				.createQueryBuilder('game')
				.select('DISTINCT game.user_id', 'userId')
				.getRawMany<{ userId: string }>();

			const userIds = usersWithGamesRaw.map(r => r.userId).filter((id): id is string => !!id);
			const usersWithGames = userIds.length;

			const results: Array<{
				userId: string;
				isConsistent: boolean;
				discrepancies: {
					totalGames: { expected: number; actual: number };
					totalQuestionsAnswered: { expected: number; actual: number };
					correctAnswers: { expected: number; actual: number };
					totalScore: { expected: number; actual: number };
				};
			}> = [];

			let consistentUsers = 0;
			let inconsistentUsers = 0;

			for (const userId of userIds) {
				const consistency = await this.checkConsistency(userId);
				results.push({
					userId,
					isConsistent: consistency.isConsistent,
					discrepancies: {
						totalGames: consistency.discrepancies.totalGames,
						totalQuestionsAnswered: consistency.discrepancies.totalQuestionsAnswered,
						correctAnswers: consistency.discrepancies.correctAnswers,
						totalScore: consistency.discrepancies.totalScore,
					},
				});

				if (consistency.isConsistent) {
					consistentUsers++;
				} else {
					inconsistentUsers++;
				}
			}

			// Get total users count
			const allUserStats = await this.userStatsRepo.find({ select: ['userId'] });
			const totalUsers = allUserStats.length;

			logger.analyticsStats('all_users_consistency_check', {
				totalUsers,
				activeUsers: usersWithGames,
				consistentUsers,
				inconsistentUsers,
			});

			return {
				totalUsers,
				usersWithGames,
				consistentUsers,
				inconsistentUsers,
				results,
			};
		} catch (error) {
			logger.analyticsError('checkAllUsersConsistency', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async fixAllInconsistentUsers(): Promise<{
		fixedCount: number;
		totalInconsistent: number;
		results: Array<{ userId: string; fixed: boolean; message: string }>;
	}> {
		try {
			const consistency = await this.checkAllUsersConsistency();
			const inconsistentUserIds = consistency.results
				.filter(r => !r.isConsistent)
				.map(r => r.userId);

			const results: Array<{ userId: string; fixed: boolean; message: string }> = [];

			for (const userId of inconsistentUserIds) {
				try {
					const fixResult = await this.fixConsistency(userId);
					results.push({ userId, fixed: fixResult.fixed, message: fixResult.message });
				} catch (error) {
					results.push({
						userId,
						fixed: false,
						message: `Failed to fix: ${getErrorMessage(error)}`,
					});
				}
			}

			const fixedCount = results.filter(r => r.fixed).length;

			logger.analyticsStats('fix_all_inconsistent_users', {
				totalInconsistent: inconsistentUserIds.length,
				fixedCount,
			});

			return {
				fixedCount,
				totalInconsistent: inconsistentUserIds.length,
				results,
			};
		} catch (error) {
			logger.analyticsError('fixAllInconsistentUsers', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	// ==================== Private Recalculation Methods ====================

	private recalculateBasicStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity[]): void {
		userStats.totalGames = gameHistory.length;
		userStats.totalQuestionsAnswered = gameHistory.reduce((sum, game) => sum + game.gameQuestionCount, 0);
		userStats.correctAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
		userStats.incorrectAnswers = gameHistory.reduce(
			(sum, game) => sum + Math.max(0, game.gameQuestionCount - game.correctAnswers),
			0
		);
		userStats.totalScore = gameHistory.reduce((sum, game) => sum + (game.score ?? 0), 0);

		if (userStats.totalQuestionsAnswered > 0) {
			userStats.overallSuccessRate = calculateSuccessRate(userStats.totalQuestionsAnswered, userStats.correctAnswers);
		} else {
			userStats.overallSuccessRate = 0;
		}

		if (gameHistory.length > 0) {
			const lastGame = gameHistory[gameHistory.length - 1];
			if (lastGame) {
				userStats.lastPlayDate = lastGame.createdAt;
				this.recalculateConsecutiveDays(userStats, gameHistory);
			} else {
				userStats.lastPlayDate = undefined;
				userStats.consecutiveDaysPlayed = 0;
			}
		} else {
			userStats.lastPlayDate = undefined;
			userStats.consecutiveDaysPlayed = 0;
		}
	}

	private recalculateConsecutiveDays(userStats: UserStatsEntity, gameHistory: GameHistoryEntity[]): void {
		if (gameHistory.length === 0) {
			userStats.consecutiveDaysPlayed = 0;
			return;
		}

		const gameDates = gameHistory.map(game => {
			const date = new Date(game.createdAt);
			date.setHours(0, 0, 0, 0);
			return date.getTime();
		});

		const uniqueDates = [...new Set(gameDates)].sort((a, b) => b - a);

		if (uniqueDates.length === 0) {
			userStats.consecutiveDaysPlayed = 0;
			return;
		}

		let consecutiveDays = 1;
		for (let i = 1; i < uniqueDates.length; i++) {
			const currentDate = uniqueDates[i - 1];
			const previousDate = uniqueDates[i];
			if (currentDate == null || previousDate == null) {
				break;
			}

			const daysDiff = Math.floor((currentDate - previousDate) / TIME_PERIODS_MS.DAY);

			if (daysDiff === 1) {
				consecutiveDays++;
			} else {
				break;
			}
		}

		userStats.consecutiveDaysPlayed = consecutiveDays;
	}

	private recalculateCategoryStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity[]): void {
		userStats.topicStats = calculateCategoryStats(gameHistory, 'topic');
		userStats.difficultyStats = calculateCategoryStats(gameHistory, 'difficulty');
	}
}
