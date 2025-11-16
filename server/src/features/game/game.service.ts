import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	CACHE_TTL,
	DEFAULT_USER_PREFERENCES,
	GameMode,
	HTTP_TIMEOUTS,
	PROVIDER_ERROR_MESSAGES,
	SERVER_GAME_CONSTANTS,
} from '@shared/constants';
import { serverLogger as logger, PointCalculationService } from '@shared/services';
import type { AnswerResult, GameDifficulty, QuestionData, TriviaQuestion, UserAnalyticsRecord } from '@shared/types';
import { buildCountRecord, getErrorMessage, isSavedGameConfiguration, isTriviaQuestionArray } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService, ServerStorageService } from '@internal/modules';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import { ValidationService } from '../../common';
import { AppConfig } from '../../config/app.config';
import { AnalyticsService } from '../analytics';
import { LeaderboardService } from '../leaderboard';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

/**
 * Service for managing trivia games, game history, and user points
 * Handles game logic, question generation, scoring, history tracking, and points management
 */
@Injectable()
export class GameService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly analyticsService: AnalyticsService,
		private readonly leaderboardService: LeaderboardService,
		private readonly cacheService: CacheService,
		private readonly storageService: ServerStorageService,
		private readonly triviaGenerationService: TriviaGenerationService,
		private readonly validationService: ValidationService,
		private readonly pointCalculationService: PointCalculationService
	) {}

	/**
	 * Get trivia question
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param questionCount Number of questions to generate
	 * @param userId User ID for personalization
	 * @returns Trivia question
	 */
	async getTriviaQuestion(topic: string, difficulty: GameDifficulty, questionCount: number = 1, userId?: string) {
		const validation = await this.validationService.validateTriviaRequest(topic, difficulty, questionCount);
		if (!validation.isValid) {
			throw new BadRequestException(validation.errors.join(', '));
		}

		const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
		const actualQuestionCount = Math.min(questionCount, maxQuestions);

		if (questionCount > maxQuestions) {
			logger.gameError(`Question count ${questionCount} exceeds limit ${maxQuestions}, using ${actualQuestionCount}`, {
				requestedCount: questionCount,
				maxQuestions,
				actualCount: actualQuestionCount,
			});
		}

		try {
			const cacheKey = `trivia:${topic}:${difficulty}:${actualQuestionCount}`;

			// Check if value exists in cache first
			const cachedResult = await this.cacheService.get<TriviaQuestion[]>(cacheKey, isTriviaQuestionArray);
			const fromCache = cachedResult.success && cachedResult.data !== null && cachedResult.data !== undefined;

			const questions = fromCache
				? cachedResult.data
				: await this.cacheService.getOrSet<TriviaQuestion[]>(
						cacheKey,
						async () => {
							const generatedQuestions = [];
							const generationTimeout = HTTP_TIMEOUTS.QUESTION_GENERATION;

							for (let i = 0; i < actualQuestionCount; i++) {
								const question = await Promise.race([
									this.triviaGenerationService.generateQuestion(topic, difficulty),
									new Promise<never>((_, reject) => {
										const timeoutId = setTimeout(() => {
											reject(new Error('Question generation timeout'));
										}, generationTimeout);

										// Clean up timeout if promise resolves
										setTimeout(() => clearTimeout(timeoutId), 0);
									}),
								]);
								generatedQuestions.push(question);
							}

							return generatedQuestions;
						},
						CACHE_TTL.TRIVIA_QUESTIONS,
						isTriviaQuestionArray
					);

			if (!fromCache && userId) {
				await this.analyticsService.trackEvent(userId, {
					eventType: 'game',
					userId,
					timestamp: new Date(),
					action: 'question_requested',
					properties: { topic, difficulty, questionCount: actualQuestionCount },
				});
			}

			return {
				questions: questions || [],
				fromCache,
			};
		} catch (error) {
			logger.gameError('Failed to generate trivia questions', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				requestedCount: actualQuestionCount,
			});

			if (this.shouldUseTriviaFallback(error)) {
				const fallbackQuestions = await this.triviaGenerationService.generateFallbackQuestions(
					topic,
					difficulty,
					actualQuestionCount,
					userId
				);

				if (userId) {
					await this.analyticsService.trackEvent(userId, {
						eventType: 'game',
						userId,
						timestamp: new Date(),
						action: 'question_requested_fallback',
						properties: { topic, difficulty, questionCount: actualQuestionCount, fallback: true },
					});
				}

				return {
					questions: fallbackQuestions,
					fromCache: false,
				};
			}

			throw createServerError('generate trivia questions', error);
		}
	}

	/**
	 * Get question by ID
	 * @param questionId Question ID
	 * @returns Question details
	 */
	async getQuestionById(questionId: string) {
		try {
			if (!questionId || questionId.trim().length === 0) {
				throw new BadRequestException('Question ID is required');
			}

			// Validate UUID format
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(questionId)) {
				throw new BadRequestException('Invalid question ID format. Must be a valid UUID');
			}

			const question = await this.triviaRepository.findOne({
				where: { id: questionId },
			});

			if (!question) {
				throw createNotFoundError('Question');
			}

			return question;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw createServerError('get question', error);
		}
	}

	/**
	 * Submit answer
	 * @param questionId Question ID
	 * @param answer User's answer
	 * @param userId User ID
	 * @param timeSpent Time spent answering
	 * @returns Answer result
	 */
	async submitAnswer(questionId: string, answer: string, userId: string, timeSpent: number): Promise<AnswerResult> {
		try {
			if (!questionId || questionId.trim().length === 0) {
				throw new BadRequestException('Question ID is required');
			}

			// Validate UUID format
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(questionId)) {
				throw new BadRequestException('Invalid question ID format. Must be a valid UUID');
			}

			const question = await this.getQuestionById(questionId);
			if (!question) {
				throw createNotFoundError('Question');
			}

			const isCorrect = this.checkAnswer(question, answer);

			const score = this.pointCalculationService.calculateAnswerPoints(
				toDifficultyLevel(question.difficulty),
				timeSpent,
				0,
				isCorrect
			);

			await this.saveGameHistory(userId, {
				score,
				totalQuestions: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: question.difficulty,
				topic: question.topic,
				gameMode: GameMode.QUESTION_LIMITED,
				timeSpent,
				creditsUsed: 0,
				questionsData: [
					{
						question: question.question,
						userAnswer: answer,
						correctAnswer: question.answers[question.correctAnswerIndex]?.text || '',
						isCorrect,
						timeSpent,
					},
				],
			});

			await this.analyticsService.trackUserAnswer(userId, questionId, {
				selectedAnswer: answer,
				correctAnswer: question.answers[question.correctAnswerIndex]?.text || '',
				topic: question.topic,
				difficulty: question.difficulty,
				isCorrect,
				timeSpent,
			});

			return {
				questionId,
				userAnswer: answer,
				correctAnswer: question.answers[question.correctAnswerIndex]?.text || '',
				isCorrect,
				timeSpent,
				pointsEarned: score,
				totalScore: 0,
				feedback: isCorrect ? 'Correct answer!' : 'Wrong answer. Try again!',
			};
		} catch (error) {
			throw createServerError('submit answer', error);
		}
	}

	/**
	 * Check if answer is correct
	 * @param question Question entity
	 * @param answer User's answer
	 * @returns Whether answer is correct
	 */
	private checkAnswer(question: TriviaEntity, answer: string): boolean {
		const correctAnswer = question.answers[question.correctAnswerIndex]?.text || '';
		return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
	}

	/**
	 * Save game history
	 * @param userId User ID
	 * @param gameData Game data to save
	 * @returns Saved game history
	 */
	async saveGameHistory(
		userId: string,
		gameData: {
			score: number;
			totalQuestions: number;
			correctAnswers: number;
			difficulty: GameDifficulty;
			topic?: string;
			gameMode: GameMode;
			timeSpent?: number;
			creditsUsed: number;
			questionsData: QuestionData[];
		}
	) {
		const sessionKey = `active_game:${userId}`;
		const result = await this.storageService.setItem(
			sessionKey,
			{
				...gameData,
				startedAt: new Date().toISOString(),
				status: 'active',
			},
			3600
		);

		if (!result.success) {
			logger.gameError('Failed to store active game session', {
				error: result.error || 'Unknown error',
				userId,
			});
		}
		try {
			logger.gameInfo('Saving game history', {
				userId,
				score: gameData.score,
				correctAnswers: gameData.correctAnswers,
				totalQuestions: gameData.totalQuestions,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const incorrectAnswers = Math.max(0, gameData.totalQuestions - gameData.correctAnswers);
			const gameHistory = this.gameHistoryRepository.create({
				userId,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
				difficulty: gameData.difficulty,
				topic: gameData.topic ?? '',
				gameMode: gameData.gameMode,
				timeSpent: gameData.timeSpent ?? 0,
				creditsUsed: gameData.creditsUsed,
				questionsData: gameData.questionsData,
			});

			const savedHistory = await this.gameHistoryRepository.save(gameHistory);
			logger.databaseCreate('game_history', {
				id: savedHistory.id,
				userId,
				score: gameData.score,
			});

			// Update user stats and leaderboard asynchronously (don't block response)
			this.leaderboardService.updateUserRanking(userId).catch(error => {
				logger.analyticsError('Failed to update user ranking after game', {
					error: getErrorMessage(error),
					userId,
				});
			});

			return {
				id: savedHistory.id,
				userId: savedHistory.userId,
				score: savedHistory.score,
				totalQuestions: savedHistory.totalQuestions,
				correctAnswers: savedHistory.correctAnswers,
				incorrectAnswers,
				successRate: (savedHistory.correctAnswers / savedHistory.totalQuestions) * 100,
				difficulty: savedHistory.difficulty,
				topic: savedHistory.topic,
				gameMode: savedHistory.gameMode,
				timeSpent: savedHistory.timeSpent,
				creditsUsed: savedHistory.creditsUsed,
				created_at: savedHistory.createdAt,
			};
		} catch (error) {
			logger.gameError('Failed to save game history', {
				error: getErrorMessage(error),
				userId,
				score: gameData.score,
			});
			throw error;
		}
	}

	/**
	 * Get user game history
	 * @param userId User ID
	 * @param limit Number of records to return
	 * @returns User game history
	 */
	async getUserGameHistory(userId: string, limit: number = 20) {
		try {
			logger.gameInfo('Getting user game history', {
				userId,
				limit,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: limit,
			});

			return {
				userId,
				username: user.username,
				totalGames: gameHistory.length,
				games: gameHistory.map(game => ({
					id: game.id,
					score: game.score,
					totalQuestions: game.totalQuestions,
					correctAnswers: game.correctAnswers,
					successRate: (game.correctAnswers / game.totalQuestions) * 100,
					difficulty: game.difficulty,
					topic: game.topic,
					gameMode: game.gameMode,
					timeSpent: game.timeSpent,
					creditsUsed: game.creditsUsed,
					created_at: game.createdAt,
				})),
			};
		} catch (error) {
			logger.gameError('Failed to get user game history', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user statistics for analytics - delegates to AnalyticsService
	 * @param userId User ID
	 * @returns User analytics data
	 */
	async getUserGameStats(userId: string): Promise<UserAnalyticsRecord> {
		try {
			return await this.analyticsService.getUserStats(userId);
		} catch (error) {
			throw createServerError('get user analytics', error);
		}
	}

	/**
	 * Get global game statistics - delegates to AnalyticsService
	 * @returns Global game statistics
	 */
	async getGlobalGameStats() {
		try {
			logger.gameInfo('Getting global game stats', {
				timeframe: 'all_time',
			});

			return await this.analyticsService.getSystemInsights();
		} catch (error) {
			logger.gameError('Failed to get global game stats', {
				error: getErrorMessage(error),
				timeframe: 'all_time',
			});
			throw error;
		}
	}

	/**
	 * Get game by ID
	 * @param gameId Game ID
	 * @returns Game details
	 */
	async getGameById(gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new BadRequestException('Game ID is required');
			}

			// Validate UUID format
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(gameId)) {
				throw new BadRequestException('Invalid game ID format. Must be a valid UUID');
			}

			logger.gameInfo('Getting game by ID', {
				id: gameId,
			});

			const game = await this.gameHistoryRepository.findOne({
				where: { id: gameId },
			});

			if (!game) {
				throw createNotFoundError('Game');
			}

			return {
				id: game.id,
				userId: game.userId,
				score: game.score,
				totalQuestions: game.totalQuestions,
				correctAnswers: game.correctAnswers,
				successRate: (game.correctAnswers / game.totalQuestions) * 100,
				difficulty: game.difficulty,
				topic: game.topic,
				gameMode: game.gameMode,
				timeSpent: game.timeSpent,
				creditsUsed: game.creditsUsed,
				questionsData: game.questionsData,
				created_at: game.createdAt,
			};
		} catch (error) {
			logger.gameError('Failed to get game by ID', {
				error: getErrorMessage(error),
				id: gameId,
			});
			throw error;
		}
	}

	/**
	 * Get user point balance
	 * @param userId User ID
	 * @returns User point balance
	 */
	async getUserPointBalance(userId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			return {
				userId: user.id,
				username: user.username,
				points: user.credits ?? 0,
			};
		} catch (error) {
			logger.gameError('Failed to get user point balance', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Add points to user
	 * @param userId User ID
	 * @param points Points to add
	 * @returns Updated point balance
	 */
	async addPoints(userId: string, points: number) {
		try {
			logger.gameInfo('Adding points to user', {
				userId,
				points,
				reason: 'Game completion',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const newPoints = (user.credits ?? 0) + points;
			await this.userRepository.update(userId, { credits: newPoints });

			return {
				userId: user.id,
				username: user.username,
				previousPoints: user.credits ?? 0,
				addedPoints: points,
				newPoints,
			};
		} catch (error) {
			logger.gameError('Failed to add points', {
				error: getErrorMessage(error),
				userId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Deduct points from user
	 * @param userId User ID
	 * @param points Points to deduct
	 * @returns Updated point balance
	 */
	async deductPoints(userId: string, points: number) {
		try {
			logger.gameInfo('Deducting points from user', {
				userId,
				points,
				reason: 'Game loss',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const currentPoints = user.credits ?? 0;
			if (currentPoints < points) {
				throw createValidationError('points', 'number');
			}

			const newPoints = currentPoints - points;
			await this.userRepository.update(userId, { credits: newPoints });

			return {
				userId: user.id,
				username: user.username,
				previousPoints: currentPoints,
				deductedPoints: points,
				newPoints,
			};
		} catch (error) {
			logger.gameError('Failed to deduct points', {
				error: getErrorMessage(error),
				userId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Save game configuration
	 * @param userId User ID
	 * @param config Game configuration
	 * @returns Save result
	 */
	async saveGameConfiguration(
		userId: string,
		config: {
			defaultDifficulty?: string;
			defaultTopic?: string;
			questionCount?: number;
			timeLimit?: number;
			soundEnabled?: boolean;
			notifications?: boolean;
		}
	) {
		try {
			logger.gameInfo('Saving game configuration', {
				userId,
				config: JSON.stringify(config),
			});

			const configKey = `game_config:${userId}`;
			const result = await this.storageService.setItem(
				configKey,
				{
					...config,
					updatedAt: new Date().toISOString(),
					userId,
				},
				0
			);

			if (!result.success) {
				logger.gameError('Failed to store game configuration', {
					userId,
					error: result.error || 'Unknown error',
				});
				throw createServerError('save game configuration', new Error('Failed to save game configuration'));
			}

			return {
				message: 'Game configuration saved successfully',
				config,
			};
		} catch (error) {
			logger.gameError('Failed to save game configuration', {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get game configuration
	 * @param userId User ID
	 * @returns Game configuration
	 */
	async getGameConfiguration(userId: string) {
		try {
			logger.gameInfo('Getting game configuration', {
				userId,
			});

			const configKey = `game_config:${userId}`;
			const result = await this.storageService.getItem(configKey, isSavedGameConfiguration);

			if (result.success && result.data) {
				return {
					config: result.data,
				};
			}

			const defaultConfig = {
				defaultDifficulty: DEFAULT_USER_PREFERENCES.game?.defaultDifficulty ?? 'medium',
				defaultTopic: DEFAULT_USER_PREFERENCES.game?.defaultTopic ?? 'general',
				questionCount: DEFAULT_USER_PREFERENCES.game?.questionLimit ?? 5,
				timeLimit: DEFAULT_USER_PREFERENCES.game?.timeLimit ?? 30,
				soundEnabled: DEFAULT_USER_PREFERENCES.soundEnabled,
			};

			return {
				config: defaultConfig,
			};
		} catch (error) {
			logger.gameError('Failed to get game configuration', {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Delete specific game from history
	 * @param userId User ID
	 * @param gameId Game ID to delete
	 * @returns Deletion result
	 */
	async deleteGameHistory(userId: string, gameId: string): Promise<{ message: string }> {
		try {
			logger.gameInfo('Deleting game history', {
				userId,
				id: gameId,
			});

			const gameHistory = await this.gameHistoryRepository.findOne({
				where: { id: gameId, userId },
			});

			if (!gameHistory) {
				throw createNotFoundError('Game history');
			}

			await this.gameHistoryRepository.remove(gameHistory);

			logger.gameInfo('Game history deleted', {
				id: gameId,
				userId,
			});

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				message: 'Game history deleted successfully',
			};
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				error: getErrorMessage(error),
				userId,
				id: gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all game history for user
	 * @param userId User ID
	 * @returns Clear result
	 */
	async clearUserGameHistory(userId: string): Promise<{ message: string; deletedCount: number }> {
		try {
			logger.gameInfo('Clearing all game history', {
				userId,
			});

			// Get count before deletion
			const count = await this.gameHistoryRepository.count({
				where: { userId },
			});

			// Delete all game history records for user
			const deleteResult = await this.gameHistoryRepository
				.createQueryBuilder()
				.delete()
				.from(GameHistoryEntity)
				.where('user_id = :userId', { userId })
				.execute();

			const deletedCount = typeof deleteResult.affected === 'number' ? deleteResult.affected : count;

			logger.gameInfo('All game history deleted', {
				userId,
				deletedCount,
			});

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				message: 'All game history cleared successfully',
				deletedCount,
			};
		} catch (error) {
			logger.gameError('Failed to clear game history', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get aggregated statistics for admin dashboard
	 */
	async getAdminStatistics(): Promise<{
		totalGames: number;
		averageScore: number;
		bestScore: number;
		totalQuestionsAnswered: number;
		correctAnswers: number;
		accuracy: number;
		activePlayers24h: number;
		topics: Record<string, number>;
		difficultyDistribution: Record<string, number>;
		lastActivity: string | null;
	}> {
		try {
			const totalsRaw = await this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(*) AS INTEGER)', 'totalGames')
				.addSelect('CAST(AVG(game.score) AS DOUBLE PRECISION)', 'averageScore')
				.addSelect('CAST(MAX(game.score) AS INTEGER)', 'bestScore')
				.addSelect('CAST(SUM(game.totalQuestions) AS INTEGER)', 'totalQuestions')
				.addSelect('CAST(SUM(game.correctAnswers) AS INTEGER)', 'correctAnswers')
				.addSelect('MAX(game.createdAt)', 'lastActivity')
				.getRawOne<{
					totalGames: number;
					averageScore: number;
					bestScore: number;
					totalQuestions: number;
					correctAnswers: number;
					lastActivity: Date;
				}>();

			const topicQueryBuilder = this.gameHistoryRepository.createQueryBuilder('game');
			topicQueryBuilder
				.select('game.topic', 'topic')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'count')
				.where('game.topic IS NOT NULL')
				.groupBy('game.topic')
				.orderBy('count', 'DESC');
			const topicStatsRaw = await topicQueryBuilder.getRawMany<{ topic: string; count: number }>();

			const difficultyQueryBuilder = this.gameHistoryRepository.createQueryBuilder('game');
			difficultyQueryBuilder
				.select('game.difficulty', 'difficulty')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'count')
				.where('game.difficulty IS NOT NULL')
				.groupBy('game.difficulty')
				.orderBy('count', 'DESC');
			const difficultyStatsRaw = await difficultyQueryBuilder.getRawMany<{ difficulty: string; count: number }>();

			const { addDateRangeConditions } = await import('../../common/queries');
			const activePlayersQueryBuilder = this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'count');
			addDateRangeConditions(
				activePlayersQueryBuilder,
				'game',
				'createdAt',
				new Date(Date.now() - 24 * 60 * 60 * 1000)
			);
			const activePlayersRaw = await activePlayersQueryBuilder.getRawOne<{ count: number }>();

			const totalGames = totalsRaw?.totalGames ?? 0;
			const totalQuestions = totalsRaw?.totalQuestions ?? 0;
			const correctAnswers = totalsRaw?.correctAnswers ?? 0;
			const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

			const topics = buildCountRecord(
				topicStatsRaw,
				stat => stat.topic ?? null,
				stat => stat.count ?? 0
			);

			const difficultyDistribution = buildCountRecord(
				difficultyStatsRaw,
				stat => stat.difficulty ?? null,
				stat => stat.count ?? 0
			);

			return {
				totalGames,
				averageScore: totalsRaw?.averageScore ?? 0,
				bestScore: totalsRaw?.bestScore ?? 0,
				totalQuestionsAnswered: totalQuestions,
				correctAnswers,
				accuracy,
				activePlayers24h: activePlayersRaw?.count ?? 0,
				topics,
				difficultyDistribution,
				lastActivity: totalsRaw?.lastActivity ? new Date(totalsRaw.lastActivity).toISOString() : null,
			};
		} catch (error) {
			logger.gameError('Failed to collect admin game statistics', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Clear game history for all users (admin)
	 */
	async clearAllGameHistory(): Promise<{ message: string; deletedCount: number }> {
		try {
			logger.gameInfo('Clearing entire game history dataset', {});

			const totalBefore = await this.gameHistoryRepository.count();

			if (totalBefore === 0) {
				logger.gameInfo('No game history records to clear', {});
				// Clear cache even if no records found
				try {
					await this.cacheService.invalidatePattern('game_history:*');
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', 'game_history:*', {
						error: getErrorMessage(cacheError),
					});
				}
				return {
					message: 'No game history records found',
					deletedCount: 0,
				};
			}

			await this.gameHistoryRepository.clear();
			const deletedCount = totalBefore;

			logger.gameInfo('All game history cleared by admin', {
				deletedCount,
			});

			// Clear cache after database deletion
			try {
				const cacheDeleted = await this.cacheService.invalidatePattern('game_history:*');
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Game history cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', 'game_history:*', {
					error: getErrorMessage(cacheError),
				});
				// Don't throw - database deletion was successful
			}

			return {
				message: 'All game history records removed successfully',
				deletedCount,
			};
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Clear all trivia questions (admin)
	 */
	async clearAllTrivia(): Promise<{ message: string; deletedCount: number }> {
		try {
			logger.gameInfo('Clearing entire trivia dataset', {});

			const totalBefore = await this.triviaRepository.count();

			if (totalBefore === 0) {
				logger.gameInfo('No trivia records to clear', {});
				// Clear cache even if no records found
				try {
					await this.cacheService.invalidatePattern('trivia:*');
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', 'trivia:*', {
						error: getErrorMessage(cacheError),
					});
				}
				return {
					message: 'No trivia records found',
					deletedCount: 0,
				};
			}

			await this.triviaRepository.clear();
			const deletedCount = totalBefore;

			logger.gameInfo('All trivia cleared by admin', {
				deletedCount,
			});

			// Clear cache after database deletion
			try {
				const cacheDeleted = await this.cacheService.invalidatePattern('trivia:*');
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Trivia cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', 'trivia:*', {
					error: getErrorMessage(cacheError),
				});
				// Don't throw - database deletion was successful
			}

			return {
				message: 'All trivia records removed successfully',
				deletedCount,
			};
		} catch (error) {
			logger.gameError('Failed to clear all trivia', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private shouldUseTriviaFallback(error: unknown): boolean {
		if (!AppConfig.features.aiFallbackEnabled) {
			return false;
		}

		const normalizedMessage = getErrorMessage(error).toLowerCase();

		// Check for general AI provider failures
		if (
			normalizedMessage.includes(PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE.toLowerCase()) ||
			normalizedMessage.includes('ai providers failed') ||
			normalizedMessage.includes('question generation timeout') ||
			normalizedMessage.includes(PROVIDER_ERROR_MESSAGES.ALL_PROVIDERS_FAILED.toLowerCase())
		) {
			return true;
		}

		// Check for specific provider errors that should trigger fallback
		const providerErrorIndicators = [
			'unauthorized',
			'401',
			'authentication failed',
			'api key',
			'rate limit',
			'429',
			'too many requests',
			'credit balance',
			'balance is too low',
			'invalid api key',
			'api key not configured',
			'provider error',
			'all providers failed',
		];

		return providerErrorIndicators.some(indicator => normalizedMessage.includes(indicator));
	}
}
