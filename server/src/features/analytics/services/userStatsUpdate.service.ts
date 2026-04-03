import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual, Repository } from 'typeorm';

import { RETRY_LIMITS, TIME_PERIODS_MS } from '@shared/constants';
import { calculateScoreRate, delay, getErrorMessage, sumBy } from '@shared/utils';

import { MAX_RECENT_ACTIVITY } from '@internal/constants';
import { GameHistoryEntity, UserStatsEntity } from '@internal/entities';
import { CacheInvalidationService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import { calculateStreak } from '@internal/utils';

@Injectable()
export class UserStatsUpdateService {
	private readonly maxPersistenceRetries = RETRY_LIMITS.userStatsPersistence;
	private readonly RETRY_DELAY_MS = TIME_PERIODS_MS.SECOND;
	private readonly STREAK_CALCULATION_DAYS = 30;
	private readonly FAILED_UPDATES_QUEUE: Map<string, GameHistoryEntity> = new Map();

	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepo: Repository<GameHistoryEntity>,
		private readonly cacheInvalidationService: CacheInvalidationService
	) {}

	async updateStatsFromGame(userId: string, gameHistory: GameHistoryEntity): Promise<void> {
		const queueKey = `${userId}:${gameHistory.id}`;

		// Remove from failed queue if it exists
		this.FAILED_UPDATES_QUEUE.delete(queueKey);

		// Add to queue before processing
		this.FAILED_UPDATES_QUEUE.set(queueKey, gameHistory);

		try {
			await this.attemptUpdateStats(userId, gameHistory);
			// Remove from queue on success
			this.FAILED_UPDATES_QUEUE.delete(queueKey);
		} catch (error) {
			logger.analyticsError('Failed to update stats after all retries', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId: gameHistory.id,
				queueKey,
			});
		}
	}

	private async attemptUpdateStats(userId: string, gameHistory: GameHistoryEntity, attempt: number = 0): Promise<void> {
		for (let currentAttempt = attempt; currentAttempt < this.maxPersistenceRetries; currentAttempt++) {
			try {
				// Wait before retry (except first attempt)
				if (currentAttempt > 0) {
					await delay(this.RETRY_DELAY_MS * currentAttempt);
				}

				await this.userStatsRepo.manager.transaction(async (manager: EntityManager) => {
					const userStatsRepo = manager.getRepository(UserStatsEntity);
					let userStats = await userStatsRepo.findOne({
						where: { userId },
						lock: { mode: 'pessimistic_write' },
					});

					if (!userStats) {
						userStats = userStatsRepo.create({ userId });
						await manager.save(UserStatsEntity, userStats);
					}

					this.updateBasicStats(userStats, gameHistory);
					this.updateCategoryStats(userStats, gameHistory);
					await this.updateStreaks(userStats, userId, manager);
					this.updateTimeBasedScores(userStats, gameHistory);
					this.updateTimeStats(userStats, gameHistory);
					this.updateBestGameScore(userStats, gameHistory);
					this.updateRecentActivity(userStats, gameHistory);

					await manager.save(UserStatsEntity, userStats);
				});

				await this.cacheInvalidationService.invalidateOnGameComplete(userId);

				logger.analyticsStats('user_stats_updated', {
					userId,
					gameId: gameHistory.id,
					attempt: currentAttempt + 1,
				});

				return;
			} catch (error) {
				const isVersionConflict = error instanceof Error && error.message.includes('version');
				const isLastAttempt = currentAttempt === this.maxPersistenceRetries - 1;

				if (isVersionConflict && !isLastAttempt) {
					continue;
				}

				if (isLastAttempt) {
					logger.analyticsError('updateStatsFromGame - final failure', {
						errorInfo: { message: getErrorMessage(error) },
						userId,
						gameId: gameHistory.id,
						attempt: currentAttempt + 1,
					});
					throw error;
				}
			}
		}
	}

	// New method to retry failed updates (could be called by a scheduled job)
	async retryFailedUpdates(): Promise<void> {
		const queueEntries = Array.from(this.FAILED_UPDATES_QUEUE.entries());

		if (queueEntries.length === 0) {
			return;
		}

		for (const [queueKey, gameHistory] of queueEntries) {
			const userId = queueKey.split(':')[0] ?? '';
			if (!userId) {
				logger.analyticsError('Invalid queue key format - missing userId', { queueKey });
				this.FAILED_UPDATES_QUEUE.delete(queueKey);
				continue;
			}
			try {
				await this.attemptUpdateStats(userId, gameHistory);
				this.FAILED_UPDATES_QUEUE.delete(queueKey);
			} catch (error) {
				logger.analyticsError('Failed to retry stats update', {
					errorInfo: { message: getErrorMessage(error) },
					queueKey,
				});
				// Keep in queue for next retry attempt
			}
		}
	}

	async removeStatsFromGame(userId: string, gameHistory: GameHistoryEntity): Promise<void> {
		for (let attempt = 0; attempt < this.maxPersistenceRetries; attempt++) {
			try {
				const userStats = await this.userStatsRepo.findOne({
					where: { userId },
				});

				if (!userStats) {
					return;
				}

				// Check if the deleted game was the best game
				const wasBestGame =
					userStats.bestGameScore === gameHistory.score &&
					userStats.bestGameDate?.getTime() === gameHistory.createdAt.getTime();

				this.decrementBasicStats(userStats, gameHistory);
				this.decrementCategoryStats(userStats, gameHistory);
				await this.updateStreaks(userStats, userId);
				this.updateTimeBasedScoresOnRemove(userStats, gameHistory);
				this.decrementTimeStats(userStats, gameHistory);
				this.removeRecentActivity(userStats, gameHistory);

				// If the deleted game was the best game, recalculate best game from remaining games
				if (wasBestGame) {
					const remainingGames = await this.gameHistoryRepo.find({
						where: { userId },
						order: { score: 'DESC', createdAt: 'DESC' },
						take: 1,
					});

					if (remainingGames.length > 0 && remainingGames[0]) {
						userStats.bestGameScore = remainingGames[0].score;
						userStats.bestGameDate = remainingGames[0].createdAt;
					} else {
						userStats.bestGameScore = 0;
						userStats.bestGameDate = undefined;
					}
				}

				await this.userStatsRepo.save(userStats);

				await this.cacheInvalidationService.invalidateOnAnalyticsUpdate(userId);

				logger.analyticsStats('user_stats_removed', {
					userId,
					gameId: gameHistory.id,
					attempt: attempt + 1,
				});

				return;
			} catch (error) {
				if (error instanceof Error && error.message.includes('version')) {
					if (attempt < this.maxPersistenceRetries - 1) {
						continue;
					}
				}

				logger.analyticsError('removeStatsFromGame', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
					gameId: gameHistory.id,
					attempt: attempt + 1,
				});

				if (attempt === this.maxPersistenceRetries - 1) {
					throw error;
				}
			}
		}
	}

	async initializeUserStats(userId: string): Promise<UserStatsEntity> {
		const userStats = this.userStatsRepo.create({
			userId,
		});
		return this.userStatsRepo.save(userStats);
	}

	async resetUserStats(userId: string): Promise<void> {
		try {
			const userStats = await this.userStatsRepo.findOne({
				where: { userId },
			});

			if (!userStats) {
				return;
			}

			userStats.totalGames = 0;
			userStats.totalQuestionsAnswered = 0;
			userStats.correctAnswers = 0;
			userStats.incorrectAnswers = 0;
			userStats.overallSuccessRate = 0;
			userStats.currentStreak = 0;
			userStats.longestStreak = 0;
			userStats.consecutiveDaysPlayed = 0;
			userStats.lastPlayDate = undefined;
			userStats.topicStats = {};
			userStats.difficultyStats = {};
			userStats.weeklyScore = 0;
			userStats.monthlyScore = 0;
			userStats.yearlyScore = 0;
			userStats.lastWeeklyReset = undefined;
			userStats.lastMonthlyReset = undefined;
			userStats.lastYearlyReset = undefined;
			userStats.averageTimePerQuestion = 0;
			userStats.totalPlayTime = 0;
			userStats.bestGameScore = 0;
			userStats.bestGameDate = undefined;
			userStats.totalScore = 0;

			await this.userStatsRepo.save(userStats);

			await this.cacheInvalidationService.invalidateOnAnalyticsUpdate(userId);

			logger.analyticsStats('user_stats_reset', {
				userId,
			});
		} catch (error) {
			logger.analyticsError('resetUserStats', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	// Public methods for maintenance

	async calculateStreaksFromHistory(
		userId: string,
		manager?: EntityManager
	): Promise<{ current: number; best: number }> {
		const cutoffDate = new Date(Date.now() - this.STREAK_CALCULATION_DAYS * TIME_PERIODS_MS.DAY);
		const repo = manager ? manager.getRepository(GameHistoryEntity) : this.gameHistoryRepo;
		const recentGames = await repo.find({
			where: { userId, createdAt: MoreThanOrEqual(cutoffDate) },
			order: { createdAt: 'DESC' },
		});
		return calculateStreak(recentGames);
	}

	calculateTimeStatsFromHistory(
		gameHistory: GameHistoryEntity[],
		totalQuestionsAnswered: number
	): { totalPlayTime: number; averageTimePerQuestion: number } {
		const totalPlayTime = sumBy(gameHistory, game => game.timeSpent ?? 0);
		const averageTimePerQuestion = totalQuestionsAnswered > 0 ? Math.floor(totalPlayTime / totalQuestionsAnswered) : 0;
		return { totalPlayTime, averageTimePerQuestion };
	}

	calculateBestGameScoreFromHistory(gameHistory: GameHistoryEntity[]): {
		bestGameScore: number;
		bestGameDate: Date | undefined;
	} {
		if (gameHistory.length === 0) {
			return { bestGameScore: 0, bestGameDate: undefined };
		}

		let bestGame: GameHistoryEntity | undefined;
		let bestScore = 0;

		for (const game of gameHistory) {
			if ((game.score ?? 0) > bestScore) {
				bestScore = game.score ?? 0;
				bestGame = game;
			}
		}

		return {
			bestGameScore: bestGame?.score ?? 0,
			bestGameDate: bestGame?.createdAt,
		};
	}

	calculateTimeBasedScoresFromHistory(gameHistory: GameHistoryEntity[]): {
		weeklyScore: number;
		monthlyScore: number;
		yearlyScore: number;
	} {
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
		const oneMonthAgo = new Date(now.getTime() - TIME_PERIODS_MS.MONTH);
		const oneYearAgo = new Date(now.getTime() - TIME_PERIODS_MS.YEAR);

		let weeklyScore = 0;
		let monthlyScore = 0;
		let yearlyScore = 0;

		for (const game of gameHistory) {
			const gameDate = new Date(game.createdAt);
			const score = game.score ?? 0;

			if (gameDate >= oneWeekAgo) {
				weeklyScore += score;
			}
			if (gameDate >= oneMonthAgo) {
				monthlyScore += score;
			}
			if (gameDate >= oneYearAgo) {
				yearlyScore += score;
			}
		}

		return { weeklyScore, monthlyScore, yearlyScore };
	}

	private updateBasicStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		userStats.totalGames += 1;
		userStats.totalQuestionsAnswered += gameHistory.gameQuestionCount;
		userStats.correctAnswers += gameHistory.correctAnswers;
		userStats.incorrectAnswers += Math.max(0, gameHistory.gameQuestionCount - gameHistory.correctAnswers);
		userStats.totalScore += gameHistory.score;

		if (userStats.totalQuestionsAnswered > 0) {
			userStats.overallSuccessRate = calculateScoreRate(userStats.totalScore, userStats.totalQuestionsAnswered);
		}

		const gameDate = new Date(gameHistory.createdAt);
		const previousLastPlayDate = userStats.lastPlayDate ? new Date(userStats.lastPlayDate) : null;

		this.updateConsecutiveDays(userStats, gameDate, previousLastPlayDate);

		if (!previousLastPlayDate || gameDate.getTime() >= previousLastPlayDate.getTime()) {
			userStats.lastPlayDate = gameHistory.createdAt;
		}
	}

	private decrementBasicStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		userStats.totalGames = Math.max(0, userStats.totalGames - 1);
		userStats.totalQuestionsAnswered = Math.max(0, userStats.totalQuestionsAnswered - gameHistory.gameQuestionCount);
		userStats.correctAnswers = Math.max(0, userStats.correctAnswers - gameHistory.correctAnswers);
		userStats.incorrectAnswers = Math.max(
			0,
			userStats.incorrectAnswers - Math.max(0, gameHistory.gameQuestionCount - gameHistory.correctAnswers)
		);
		userStats.totalScore = Math.max(0, userStats.totalScore - gameHistory.score);

		if (userStats.totalQuestionsAnswered > 0) {
			userStats.overallSuccessRate = calculateScoreRate(userStats.totalScore, userStats.totalQuestionsAnswered);
		} else {
			userStats.overallSuccessRate = 0;
		}
	}

	private updateConsecutiveDays(userStats: UserStatsEntity, gameDate: Date, previousLastPlayDate: Date | null): void {
		const gameDay = new Date(gameDate);
		gameDay.setHours(0, 0, 0, 0);

		const lastPlayDate = previousLastPlayDate ? new Date(previousLastPlayDate) : null;
		if (lastPlayDate) {
			lastPlayDate.setHours(0, 0, 0, 0);
		}

		if (!lastPlayDate) {
			userStats.consecutiveDaysPlayed = 1;
			return;
		}

		const daysDiff = Math.floor((gameDay.getTime() - lastPlayDate.getTime()) / TIME_PERIODS_MS.DAY);

		if (daysDiff === 0) {
			return;
		} else if (daysDiff === 1) {
			userStats.consecutiveDaysPlayed += 1;
		} else {
			userStats.consecutiveDaysPlayed = 1;
		}
	}

	private updateCategoryStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (gameHistory.gameQuestionCount <= 0) {
			return;
		}
		if (gameHistory.topic) {
			const key = gameHistory.topic.trim().toLowerCase();
			const existingKey = Object.keys(userStats.topicStats ?? {}).find(k => k.toLowerCase() === key);
			const existingTopicStats = existingKey ? userStats.topicStats[existingKey] : undefined;
			const topicStats = existingTopicStats ?? {
				totalQuestionsAnswered: 0,
				correctAnswers: 0,
				successRate: 0,
				score: 0,
				lastPlayed: new Date(0),
			};

			topicStats.totalQuestionsAnswered += gameHistory.gameQuestionCount;
			topicStats.correctAnswers += gameHistory.correctAnswers;
			topicStats.score += gameHistory.score;
			topicStats.successRate = calculateScoreRate(topicStats.score, topicStats.totalQuestionsAnswered);

			const gameDate = new Date(gameHistory.createdAt);
			if (gameDate > topicStats.lastPlayed) {
				topicStats.lastPlayed = gameDate;
			}

			if (existingKey && existingKey !== key) {
				delete userStats.topicStats[existingKey];
			}
			userStats.topicStats[key] = topicStats;
		}

		if (gameHistory.difficulty) {
			const existingDifficultyStats = userStats.difficultyStats[gameHistory.difficulty];
			const difficultyStats = existingDifficultyStats ?? {
				totalQuestionsAnswered: 0,
				correctAnswers: 0,
				successRate: 0,
				score: 0,
				lastPlayed: new Date(0),
			};

			difficultyStats.totalQuestionsAnswered += gameHistory.gameQuestionCount;
			difficultyStats.correctAnswers += gameHistory.correctAnswers;
			difficultyStats.score += gameHistory.score;
			difficultyStats.successRate = calculateScoreRate(difficultyStats.score, difficultyStats.totalQuestionsAnswered);

			const gameDate = new Date(gameHistory.createdAt);
			if (gameDate > difficultyStats.lastPlayed) {
				difficultyStats.lastPlayed = gameDate;
			}

			userStats.difficultyStats[gameHistory.difficulty] = difficultyStats;
		}
	}

	private decrementCategoryStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (gameHistory.topic) {
			const key = gameHistory.topic.trim().toLowerCase();
			const existingKey = Object.keys(userStats.topicStats ?? {}).find(k => k.toLowerCase() === key);
			const topicStats = existingKey ? userStats.topicStats[existingKey] : undefined;
			if (topicStats) {
				topicStats.totalQuestionsAnswered = Math.max(
					0,
					topicStats.totalQuestionsAnswered - gameHistory.gameQuestionCount
				);
				topicStats.correctAnswers = Math.max(0, topicStats.correctAnswers - gameHistory.correctAnswers);
				topicStats.score = Math.max(0, topicStats.score - gameHistory.score);

				if (topicStats.totalQuestionsAnswered > 0) {
					topicStats.successRate = calculateScoreRate(topicStats.score, topicStats.totalQuestionsAnswered);
					if (existingKey && existingKey !== key) {
						delete userStats.topicStats[existingKey];
						userStats.topicStats[key] = topicStats;
					}
				} else if (existingKey !== undefined) {
					delete userStats.topicStats[existingKey];
				}
			}
		}

		if (gameHistory.difficulty) {
			const difficultyStats = userStats.difficultyStats[gameHistory.difficulty];
			if (difficultyStats) {
				difficultyStats.totalQuestionsAnswered = Math.max(
					0,
					difficultyStats.totalQuestionsAnswered - gameHistory.gameQuestionCount
				);
				difficultyStats.correctAnswers = Math.max(0, difficultyStats.correctAnswers - gameHistory.correctAnswers);
				difficultyStats.score = Math.max(0, difficultyStats.score - gameHistory.score);

				if (difficultyStats.totalQuestionsAnswered > 0) {
					difficultyStats.successRate = calculateScoreRate(
						difficultyStats.score,
						difficultyStats.totalQuestionsAnswered
					);
				} else {
					delete userStats.difficultyStats[gameHistory.difficulty];
				}
			}
		}
	}

	private async updateStreaks(userStats: UserStatsEntity, userId: string, manager?: EntityManager): Promise<void> {
		const streakData = await this.calculateStreaksFromHistory(userId, manager);
		userStats.currentStreak = streakData.current;
		userStats.longestStreak = streakData.best;
	}

	private updateTimeBasedScores(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		const now = new Date();
		this.checkAndResetWeeklyScore(userStats, now);
		this.checkAndResetMonthlyScore(userStats, now);
		this.checkAndResetYearlyScore(userStats, now);

		userStats.weeklyScore += gameHistory.score;
		userStats.monthlyScore += gameHistory.score;
		userStats.yearlyScore += gameHistory.score;
	}

	private updateTimeBasedScoresOnRemove(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		const now = new Date();
		const gameDate = new Date(gameHistory.createdAt);

		const oneWeekAgo = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
		const oneMonthAgo = new Date(now.getTime() - TIME_PERIODS_MS.MONTH);
		const oneYearAgo = new Date(now.getTime() - TIME_PERIODS_MS.YEAR);

		// Only decrement scores if the game was within the relevant time period
		if (gameDate >= oneWeekAgo) {
			userStats.weeklyScore = Math.max(0, userStats.weeklyScore - gameHistory.score);
		}
		if (gameDate >= oneMonthAgo) {
			userStats.monthlyScore = Math.max(0, userStats.monthlyScore - gameHistory.score);
		}
		if (gameDate >= oneYearAgo) {
			userStats.yearlyScore = Math.max(0, userStats.yearlyScore - gameHistory.score);
		}
	}

	private checkAndResetWeeklyScore(userStats: UserStatsEntity, now: Date): void {
		if (!userStats.lastWeeklyReset) {
			userStats.lastWeeklyReset = now;
			return;
		}

		const lastReset = new Date(userStats.lastWeeklyReset);
		const weekDiff = Math.floor((now.getTime() - lastReset.getTime()) / TIME_PERIODS_MS.WEEK);

		if (weekDiff >= 1) {
			userStats.weeklyScore = 0;
			userStats.lastWeeklyReset = now;
		}
	}

	private checkAndResetMonthlyScore(userStats: UserStatsEntity, now: Date): void {
		if (!userStats.lastMonthlyReset) {
			userStats.lastMonthlyReset = now;
			return;
		}

		const lastReset = new Date(userStats.lastMonthlyReset);
		const monthDiff = Math.floor((now.getTime() - lastReset.getTime()) / TIME_PERIODS_MS.MONTH);

		if (monthDiff >= 1) {
			userStats.monthlyScore = 0;
			userStats.lastMonthlyReset = now;
		}
	}

	private checkAndResetYearlyScore(userStats: UserStatsEntity, now: Date): void {
		if (!userStats.lastYearlyReset) {
			userStats.lastYearlyReset = now;
			return;
		}

		const lastReset = new Date(userStats.lastYearlyReset);
		const yearDiff = Math.floor((now.getTime() - lastReset.getTime()) / TIME_PERIODS_MS.YEAR);

		if (yearDiff >= 1) {
			userStats.yearlyScore = 0;
			userStats.lastYearlyReset = now;
		}
	}

	private updateTimeStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (gameHistory.timeSpent) {
			userStats.totalPlayTime += gameHistory.timeSpent;

			if (userStats.totalQuestionsAnswered > 0) {
				userStats.averageTimePerQuestion = Math.floor(userStats.totalPlayTime / userStats.totalQuestionsAnswered);
			}
		}
	}

	private decrementTimeStats(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (gameHistory.timeSpent) {
			userStats.totalPlayTime = Math.max(0, userStats.totalPlayTime - gameHistory.timeSpent);

			if (userStats.totalQuestionsAnswered > 0) {
				userStats.averageTimePerQuestion = Math.floor(userStats.totalPlayTime / userStats.totalQuestionsAnswered);
			} else {
				userStats.averageTimePerQuestion = 0;
			}
		}
	}

	private updateBestGameScore(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (gameHistory.score > userStats.bestGameScore) {
			userStats.bestGameScore = gameHistory.score;
			userStats.bestGameDate = gameHistory.createdAt;
		}
	}

	private updateRecentActivity(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		const activityEntry = {
			gameId: gameHistory.id,
			score: gameHistory.score,
			correctAnswers: gameHistory.correctAnswers,
			totalQuestions: gameHistory.gameQuestionCount,
			timeSpent: gameHistory.timeSpent ?? 0,
			topic: gameHistory.topic,
			difficulty: gameHistory.difficulty,
			createdAt: gameHistory.createdAt,
		};

		// Add new activity to the beginning
		const recentActivity = [activityEntry, ...(userStats.recentActivity || [])];

		// Keep only the most recent 10
		userStats.recentActivity = recentActivity.slice(0, MAX_RECENT_ACTIVITY);
	}

	private removeRecentActivity(userStats: UserStatsEntity, gameHistory: GameHistoryEntity): void {
		if (!userStats.recentActivity) {
			return;
		}

		// Remove the game from recent activity
		userStats.recentActivity = userStats.recentActivity.filter(activity => activity.gameId !== gameHistory.id);
	}
}
