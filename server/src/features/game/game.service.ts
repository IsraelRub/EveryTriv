import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CACHE_TTL, DEFAULT_USER_PREFERENCES, GameMode, HTTP_TIMEOUTS, SERVER_GAME_CONSTANTS } from '@shared/constants';
import { serverLogger as logger, PointCalculationService } from '@shared/services';
import type { AnswerResult, GameDifficulty, QuestionData, UserAnalytics } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService, ServerStorageService } from '@internal/modules';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import { ValidationService } from '../../common';
import { AnalyticsService } from '../analytics';
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

			const questions = await this.cacheService.getOrSet(
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
				CACHE_TTL.TRIVIA_QUESTIONS
			);

			if (userId) {
				await this.analyticsService.trackEvent(userId, {
					eventType: 'game',
					userId,
					timestamp: new Date(),
					action: 'question_requested',
					properties: { topic, difficulty, questionCount: actualQuestionCount },
				});
			}

			return {
				questions,
				fromCache: false,
			};
		} catch (error) {
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
			const question = await this.triviaRepository.findOne({
				where: { id: questionId },
			});

			if (!question) {
				throw createNotFoundError('Question');
			}

			return question;
		} catch (error) {
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

			await this.updateUserScore(userId, score);

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
	 * Update user score
	 * @param userId User ID
	 * @param score Score to add
	 */
	private async updateUserScore(userId: string, score: number): Promise<void> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			user.score += score;
			await this.userRepository.save(user);

			await this.cacheService.delete(`user:score:${userId}`);
			await this.cacheService.invalidatePattern(`leaderboard:*`);
			await this.cacheService.invalidatePattern(`analytics:user:${userId}`);

			const result = await this.storageService.removeItem(`active_game:${userId}`);
			if (!result.success) {
				logger.gameError('Failed to clear active game session', {
					error: result.error || 'Unknown error',
					userId,
				});
			}
		} catch (error) {
			throw createServerError('update user score', error);
		}
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

			const gameHistory = this.gameHistoryRepository.create({
				userId,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
				difficulty: gameData.difficulty,
				topic: gameData.topic,
				gameMode: gameData.gameMode,
				timeSpent: gameData.timeSpent,
				creditsUsed: gameData.creditsUsed,
				questionsData: gameData.questionsData,
			});

			const savedHistory = await this.gameHistoryRepository.save(gameHistory);
			logger.databaseCreate('game_history', {
				id: savedHistory.id,
				userId,
				score: gameData.score,
			});

			return {
				id: savedHistory.id,
				userId: savedHistory.userId,
				score: savedHistory.score,
				totalQuestions: savedHistory.totalQuestions,
				correctAnswers: savedHistory.correctAnswers,
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
	async getUserGameStats(userId: string): Promise<UserAnalytics> {
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
			const result = await this.storageService.getItem(configKey);

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
			await this.gameHistoryRepository.delete({ userId });

			logger.gameInfo('All game history deleted', {
				userId,
				deletedCount: count,
			});

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				message: 'All game history cleared successfully',
				deletedCount: count,
			};
		} catch (error) {
			logger.gameError('Failed to clear game history', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}
}
