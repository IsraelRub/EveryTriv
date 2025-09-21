import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_TTL, GAME_ERROR_MESSAGES, GameMode , SERVER_GAME_CONSTANTS,serverLogger as logger  } from '@shared';
import { AnswerResult, UserAnalytics,UserScoreData  } from '@shared/types';
import { GameHistoryEntity, TriviaEntity, UserEntity } from 'src/internal/entities';
import { CacheService } from 'src/internal/modules/cache';
import { ServerStorageService } from 'src/internal/modules/storage';
import { MoreThan, Repository } from 'typeorm';

import { ValidationService } from '../../common';
import { AnalyticsService } from '../analytics/analytics.service';
import { TriviaGenerationService } from './logic/triviaGeneration.service';
import { PointCalculationService } from '@shared/services/points/pointCalculation.service';

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
	async getTriviaQuestion(topic: string, difficulty: string, questionCount: number = 1, userId?: string) {
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
					const generationTimeout = SERVER_GAME_CONSTANTS.QUESTION_GENERATION_TIMEOUT;

					for (let i = 0; i < actualQuestionCount; i++) {
						const question = await Promise.race([
							this.triviaGenerationService.generateQuestion(topic, difficulty),
							new Promise((_, reject) =>
								setTimeout(() => reject(new Error('Question generation timeout')), generationTimeout)
							),
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
			throw new Error(
				`Failed to generate trivia questions: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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
				throw new Error(GAME_ERROR_MESSAGES.QUESTION_NOT_FOUND);
			}

			return question;
		} catch (error) {
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_GET_QUESTION}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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
				throw new Error(GAME_ERROR_MESSAGES.QUESTION_NOT_FOUND);
			}

			const isCorrect = this.checkAnswer(question, answer);

			const score = this.pointCalculationService.calculateAnswerPoints(question.difficulty, timeSpent, 0, isCorrect);

			await this.saveGameHistory(userId, {
				score,
				totalQuestions: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: question.difficulty,
				topic: question.topic,
				gameMode: 'CLASSIC',
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
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_SUBMIT_ANSWER}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get user analytics - delegates to AnalyticsService
	 * @param userId User ID
	 * @returns User analytics
	 */
	async getUserAnalytics(userId: string) {
		try {
			return await this.analyticsService.getUserStats(userId);
		} catch (error) {
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_GET_ANALYTICS}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Private helper functions for internal game operations
	 */

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
				throw new Error('User not found');
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
			throw new Error(`Failed to update user score: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get user score data
	 * @param userId User ID
	 * @returns User score data
	 */
	async getUserScoreData(userId: string): Promise<UserScoreData> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				select: ['score', 'correctAnswers', 'totalQuestions'],
			});

			const totalPoints = gameHistory.reduce((sum, game) => sum + (game.score || 0), 0);
			const gamesPlayed = gameHistory.length;
			const totalCorrectAnswers = gameHistory.reduce((sum, game) => sum + (game.correctAnswers || 0), 0);
			const totalQuestions = gameHistory.reduce((sum, game) => sum + (game.totalQuestions || 0), 0);
			const successRate = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

			return {
				userId: user.id,
				username: user.username,
				score: user.score,
				rank: await this.getUserRank(userId),
				totalPoints,
				gamesPlayed,
				successRate: Math.round(successRate * 100) / 100,
			};
		} catch (error) {
			throw new Error(`Failed to get user score data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
			difficulty: string;
			topic?: string;
			gameMode: string;
			timeSpent?: number;
			creditsUsed: number;
			questionsData: Array<{
				question: string;
				userAnswer: string;
				correctAnswer: string;
				isCorrect: boolean;
				timeSpent?: number;
			}>;
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
			logger.game('Saving game history', {
				userId,
				score: gameData.score,
				correctAnswers: gameData.correctAnswers,
				totalQuestions: gameData.totalQuestions,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const gameHistory = this.gameHistoryRepository.create({
				userId,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
				difficulty: gameData.difficulty,
				topic: gameData.topic,
				gameMode: gameData.gameMode as GameMode,
				timeSpent: gameData.timeSpent,
				creditsUsed: gameData.creditsUsed,
				questionsData: gameData.questionsData,
			});

			const savedHistory = (await this.gameHistoryRepository.save(gameHistory)) as GameHistoryEntity;
			logger.databaseCreate('game_history', {
				historyId: savedHistory.id,
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
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Getting user game history', {
				userId,
				limit,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
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
				error: error instanceof Error ? error.message : 'Unknown error',
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
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_GET_ANALYTICS}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get global game statistics - delegates to AnalyticsService
	 * @returns Global game statistics
	 */
	async getGlobalGameStats() {
		try {
			logger.game('Getting global game stats', {
				timeframe: 'all_time',
			});

			return await this.analyticsService.getSystemInsights();
		} catch (error) {
			logger.gameError('Failed to get global game stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Getting game by ID', {
				gameId,
			});

			const game = await this.gameHistoryRepository.findOne({
				where: { id: gameId },
			});

			if (!game) {
				throw new Error('Game not found');
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
				error: error instanceof Error ? error.message : 'Unknown error',
				gameId,
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
				throw new Error('User not found');
			}

			return {
				userId: user.id,
				username: user.username,
				points: user.credits || 0,
			};
		} catch (error) {
			logger.gameError('Failed to get user point balance', {
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Adding points to user', {
				userId,
				points,
				reason: 'Game completion',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const newPoints = (user.credits || 0) + points;
			await this.userRepository.update(userId, { credits: newPoints });

			return {
				userId: user.id,
				username: user.username,
				previousPoints: user.credits || 0,
				addedPoints: points,
				newPoints,
			};
		} catch (error) {
			logger.gameError('Failed to add points', {
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Deducting points from user', {
				userId,
				points,
				reason: 'Game loss',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const currentPoints = user.credits || 0;
			if (currentPoints < points) {
				throw new Error('Insufficient points');
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
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Saving game configuration', {
				userId,
				config,
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
				throw new Error('Failed to save game configuration');
			}

			return {
				success: true,
				message: 'Game configuration saved successfully',
				config,
			};
		} catch (error) {
			logger.gameError('Failed to save game configuration', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.game('Getting game configuration', {
				userId,
			});

			const configKey = `game_config:${userId}`;
			const result = await this.storageService.getItem(configKey);

			if (result.success && result.data) {
				return {
					success: true,
					config: result.data,
				};
			}

			const defaultConfig = {
				defaultDifficulty: 'medium',
				defaultTopic: 'general',
				questionCount: 5,
				timeLimit: 30,
				soundEnabled: true,
				notifications: true,
			};

			return {
				success: true,
				config: defaultConfig,
			};
		} catch (error) {
			logger.gameError('Failed to get game configuration', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async deleteGameHistory(userId: string, gameId: string): Promise<{ success: boolean; message: string }> {
		try {
			logger.game('Deleting game history', {
				userId,
				gameId,
			});

			const gameHistory = await this.gameHistoryRepository.findOne({
				where: { id: gameId, userId },
			});

			if (!gameHistory) {
				throw new Error('Game history not found or access denied');
			}

			await this.gameHistoryRepository.remove(gameHistory);

			logger.game('Game history deleted', {
				gameId,
				userId,
			});

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				success: true,
				message: 'Game history deleted successfully',
			};
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all game history for user
	 * @param userId User ID
	 * @returns Clear result
	 */
	async clearUserGameHistory(userId: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
		try {
			logger.game('Clearing all game history', {
				userId,
			});

			// Get count before deletion
			const count = await this.gameHistoryRepository.count({
				where: { userId },
			});

			// Delete all game history records for user
			await this.gameHistoryRepository.delete({ userId });

			logger.game('All game history deleted', {
				userId,
				deletedCount: count,
			});

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				success: true,
				message: 'All game history cleared successfully',
				deletedCount: count,
			};
		} catch (error) {
			logger.gameError('Failed to clear game history', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}
}
