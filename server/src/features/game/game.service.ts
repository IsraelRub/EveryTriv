import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	CACHE_DURATION,
	DEFAULT_USER_PREFERENCES,
	DifficultyLevel,
	ERROR_CODES,
	ERROR_MESSAGES,
	GAME_MODES_CONFIG,
	GameMode,
	GameStatus,
	HTTP_TIMEOUTS,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type {
	AdminGameStatistics,
	AdminStatisticsRaw,
	AnswerResult,
	ClearOperationResponse,
	GameDifficulty,
	GameHistoryEntry,
	GameHistoryResponse,
	QuestionData,
	TriviaQuestion,
} from '@shared/types';
import {
	buildCountRecord,
	calculateAnswerScore,
	checkAnswerCorrectness,
	createAnswerResult,
	createQuestionData,
	getErrorMessage,
	normalizeGameData,
} from '@shared/utils';
import { isSavedGameConfiguration } from '@shared/utils/domain';
import { isRegisteredDifficulty, restoreGameDifficulty, toDifficultyLevel } from '@shared/validation';
import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService, ServerStorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { PromptParams } from '@internal/types';
import { UUID_REGEX } from '@internal/constants';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';
import { addDateRangeConditions, createGroupByQuery } from '../../common/queries';
import { AnalyticsService } from '../analytics';
import { LeaderboardService } from '../leaderboard';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

/**
 * Service for managing trivia games, game history, and user scoring
 * Handles game logic, question generation, scoring, history tracking, and scoring management
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
		private readonly triviaGenerationService: TriviaGenerationService
	) {}

	/**
	 * Get questions that user has already seen from game history
	 * Retrieves all questions from user's game history to prevent showing the same questions again
	 * @param userId User ID
	 * @returns Set of question texts (normalized to lowercase) that the user has already seen
	 */
	private async getUserSeenQuestions(userId: string): Promise<Set<string>> {
		try {
			const gameHistories = await this.gameHistoryRepository.find({
				where: { userId },
				select: ['questionsData'],
			});

			const seenQuestions = new Set<string>();
			for (const history of gameHistories) {
				if (history.questionsData && Array.isArray(history.questionsData)) {
					for (const questionData of history.questionsData) {
						if (questionData.question && typeof questionData.question === 'string') {
							seenQuestions.add(questionData.question.toLowerCase().trim());
						}
					}
				}
		}

		return seenQuestions;
		} catch (error) {
			logger.gameError('Failed to get user seen questions', {
				error: getErrorMessage(error),
				userId,
			});
			return new Set<string>();
		}
	}

	/**
	 * Get trivia questions with smart retrieval strategy
	 *
	 * Process flow:
	 * 1. Validates the trivia request (topic, difficulty, questionsPerRequest)
	 * 2. Retrieves questions the user has already seen from game history
	 * 3. Checks if questions exist in database for the requested topic and difficulty
	 * 4. Attempts to retrieve existing questions from database first (excluding user's seen questions)
	 * 5. If not enough questions exist, generates new questions using AI
	 * 6. When generating new questions, checks if question already exists in database before saving
	 * 7. Prevents duplicate questions within the same request batch
	 * 8. Ensures user never receives the same question across different game sessions
	 *
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param questionsPerRequest Number of questions requested by user
	 * @param userId User ID for personalization and to exclude already seen questions
	 * @param answerCount Number of answer choices per question (3-5)
	 * @returns Trivia questions with fromCache flag
	 */
	async getTriviaQuestion(
		topic: string,
		difficulty: GameDifficulty,
		questionsPerRequest: number = 1,
		userId?: string,
		answerCount?: number
	) {
		// Note: questionsPerRequest is already validated and converted by TriviaRequestPipe
		// For unlimited mode (-1), we request questions in batches to allow continuous gameplay
		const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;

		// For unlimited mode, request questions in batches (MAX per request)
		// This allows continuous gameplay while respecting server limits
		// Note: In unlimited mode, the client should request 1 question at a time for subsequent requests
		// to avoid unnecessary credit deductions. The initial request uses -1 to indicate unlimited mode.
		const normalizedQuestionsPerRequest =
			questionsPerRequest === UNLIMITED ? MAX : Math.min(questionsPerRequest, MAX);

		if (questionsPerRequest > MAX && questionsPerRequest !== UNLIMITED) {
		logger.gameError(
			`Questions per request ${questionsPerRequest} exceeds limit ${MAX}, using ${normalizedQuestionsPerRequest}`,
			{
				requestedCount: questionsPerRequest,
				actualCount: normalizedQuestionsPerRequest,
			}
		);
		}

		try {
			// Get user's seen questions if userId is provided
			const userSeenQuestions = userId ? await this.getUserSeenQuestions(userId) : new Set<string>();
			const excludeQuestionTexts = Array.from(userSeenQuestions);

		// Check if questions exist in database for this topic and difficulty
		const hasExistingQuestions = await this.triviaGenerationService.hasQuestionsForTopicAndDifficulty(
			topic,
			difficulty
		);

		// Try to get existing questions first
			let availableQuestions: TriviaEntity[] = [];
			if (hasExistingQuestions) {
				availableQuestions = await this.triviaGenerationService.getAvailableQuestions(
					topic,
					difficulty,
					normalizedQuestionsPerRequest * 2,
					excludeQuestionTexts
				);
			}

			const questions: TriviaQuestion[] = [];
			const excludeQuestions: string[] = [...excludeQuestionTexts];
			// All duplicate prevention happens here on the server—LLM prompts never manage exclusion lists.
			const appendExcludeQuestion = (value?: string) => {
				if (!value) {
					return;
				}

				const trimmed = value.trim();
				if (!trimmed) {
					return;
				}

				const normalized = trimmed.toLowerCase();
				const exists = excludeQuestions.some(existing => existing.trim().toLowerCase() === normalized);
				if (!exists) {
					excludeQuestions.push(trimmed);
				}
			};
			const generationTimeout = HTTP_TIMEOUTS.QUESTION_GENERATION;
			const maxRetries = 3;

			// Use existing questions first
			// Note: getAvailableQuestions already filters excluded questions at SQL level
			for (const questionEntity of availableQuestions) {
				if (questions.length >= normalizedQuestionsPerRequest) {
					break;
				}

				// Restore GameDifficulty from entity (DifficultyLevel) and metadata if available
				const restoredDifficulty = restoreGameDifficulty(
					questionEntity.difficulty,
					questionEntity.metadata?.difficulty
				);

				questions.push({
					id: questionEntity.id,
					topic: questionEntity.topic,
					difficulty: restoredDifficulty,
					question: questionEntity.question,
					answers: questionEntity.answers,
					correctAnswerIndex: questionEntity.correctAnswerIndex,
					metadata: questionEntity.metadata,
					createdAt: questionEntity.createdAt,
					updatedAt: questionEntity.updatedAt,
				});

				appendExcludeQuestion(questionEntity.question);
			}

		// Generate new questions if we don't have enough
		const remainingCount = normalizedQuestionsPerRequest - questions.length;
		if (remainingCount > 0) {
			for (let i = 0; i < remainingCount; i++) {
					let question: TriviaQuestion | null = null;
					let retries = 0;

					while (retries < maxRetries && !question) {
						try {
							const promptParams: PromptParams = {
								topic,
								difficulty,
								answerCount: answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
							};
							const generationResult = await Promise.race([
								this.triviaGenerationService.generateQuestion(promptParams, userId),
								new Promise<never>((_, reject) => {
									const timeoutId = setTimeout(() => {
										reject(new Error(ERROR_CODES.QUESTION_GENERATION_TIMEOUT));
									}, generationTimeout);

									setTimeout(() => clearTimeout(timeoutId), 0);
								}),
							]);

							const questionEntity = generationResult;
							const questionText = questionEntity.question.toLowerCase().trim();

							// Check if this question is a duplicate in the current batch or already seen by user
							if (excludeQuestions.some(existing => existing.toLowerCase().trim() === questionText)) {
								logger.gameError('Generated duplicate question, retrying', {
									topic,
									difficulty,
									attempt: retries + 1,
									count: questions.length + i + 1,
								});
								retries++;
								continue;
							}

							// Restore GameDifficulty from entity (DifficultyLevel) and metadata if available
							const restoredDifficulty = restoreGameDifficulty(
								questionEntity.difficulty,
								questionEntity.metadata?.difficulty
							);

							question = {
								id: questionEntity.id,
								topic: questionEntity.topic,
								difficulty: restoredDifficulty,
								question: questionEntity.question,
								answers: questionEntity.answers,
								correctAnswerIndex: questionEntity.correctAnswerIndex,
								metadata: questionEntity.metadata,
								createdAt: questionEntity.createdAt,
								updatedAt: questionEntity.updatedAt,
							};

							appendExcludeQuestion(questionEntity.question);
							questions.push(question);
						} catch (error) {
							logger.gameError('Failed to generate question, retrying', {
								error: getErrorMessage(error),
								topic,
								difficulty,
								attempt: retries + 1,
								count: questions.length + i + 1,
							});
							retries++;
						}
					}

					if (!question) {
						logger.gameError('Failed to generate question after max retries', {
							topic,
							difficulty,
							count: questions.length + i + 1,
							maxRetries,
						});
					}
				}
			}

			// If we have fewer questions than requested, log a warning
			if (questions.length < normalizedQuestionsPerRequest) {
				logger.gameError(`Got ${questions.length} questions out of ${normalizedQuestionsPerRequest} requested`, {
					topic,
					difficulty,
					requestedCount: normalizedQuestionsPerRequest,
					actualCount: questions.length,
					totalItems: availableQuestions.length,
				});
			}

		const fromCache = false;

		return {
			questions: questions || [],
			fromCache,
		};
		} catch (error) {
			logger.gameError('Failed to generate trivia questions', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				requestedCount: normalizedQuestionsPerRequest,
			});

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
				throw new BadRequestException(ERROR_CODES.QUESTION_ID_REQUIRED);
			}

		// Validate UUID format
		if (!UUID_REGEX.test(questionId)) {
			throw new BadRequestException(ERROR_CODES.INVALID_QUESTION_ID_FORMAT);
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
				throw new BadRequestException(ERROR_CODES.QUESTION_ID_REQUIRED);
			}

		// Validate UUID format
		if (!UUID_REGEX.test(questionId)) {
			throw new BadRequestException(ERROR_CODES.INVALID_QUESTION_ID_FORMAT);
		}

		const question = await this.getQuestionById(questionId);
		if (!question) {
			throw createNotFoundError('Question');
		}

		const isCorrect = checkAnswerCorrectness(question, answer);

			const score = calculateAnswerScore(toDifficultyLevel(question.difficulty), timeSpent, 0, isCorrect);

			const questionData = createQuestionData(question, answer, isCorrect, timeSpent);

			await this.saveGameHistory(userId, {
				score,
				gameQuestionCount: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: question.difficulty,
				topic: question.topic,
				gameMode: GameMode.QUESTION_LIMITED,
				timeSpent,
				creditsUsed: 0,
				questionsData: [questionData],
		});

		await this.analyticsService.trackUserAnswer(userId, questionId);

		return createAnswerResult(questionId, question, answer, isCorrect, timeSpent, score, 0);
	} catch (error) {
			throw createServerError('submit answer', error);
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
			gameQuestionCount: number;
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
		const result = await this.storageService.set(
			sessionKey,
			{
				...gameData,
				startedAt: new Date().toISOString(),
				status: GameStatus.IN_PROGRESS,
			},
			CACHE_DURATION.VERY_LONG
		);

		if (!result.success) {
			logger.gameError('Failed to store active game session', {
				error: result.error || ERROR_MESSAGES.general.UNKNOWN_ERROR,
				userId,
			});
		}
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Normalize game data before creating entity
			const normalizedData = normalizeGameData(gameData, { userId });
			const incorrectAnswers = Math.max(0, normalizedData.gameQuestionCount - normalizedData.correctAnswers);
			const gameHistory = this.gameHistoryRepository.create({
				userId,
				score: normalizedData.score,
				gameQuestionCount: normalizedData.gameQuestionCount,
				correctAnswers: normalizedData.correctAnswers,
				difficulty: normalizedData.difficulty,
				topic: normalizedData.topic,
				gameMode: normalizedData.gameMode,
				timeSpent: normalizedData.timeSpent,
				creditsUsed: normalizedData.creditsUsed,
				questionsData: normalizedData.questionsData,
			});

			const savedHistory = await this.gameHistoryRepository.save(gameHistory);

			this.cacheService.delete(`cache:game_history:${userId}`).catch(error => {
				logger.cacheError('Failed to invalidate game history cache', `cache:game_history:${userId}`, {
					error: getErrorMessage(error),
					userId,
				});
			});

			// Update user stats and leaderboard asynchronously (don't block response)
			this.leaderboardService.updateUserRanking(userId).catch(error => {
				logger.analyticsError('Failed to update user ranking after game', {
					error: getErrorMessage(error),
					userId,
				});
			});

			// Invalidate analytics cache (including global difficulty stats)
			this.cacheService.invalidatePattern('analytics:difficulty:global').catch(error => {
				logger.analyticsError('Failed to invalidate difficulty stats cache', {
					error: getErrorMessage(error),
					userId,
				});
			});

			const { user: _user, questionsData: _questionsData, updatedAt: _updatedAt, ...rest } = savedHistory;
			return {
				...rest,
				gameId: savedHistory.id,
				incorrectAnswers,
				successRate: (savedHistory.correctAnswers / savedHistory.gameQuestionCount) * 100,
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
	async getUserGameHistory(userId: string, limit: number = 20, offset: number = 0): Promise<GameHistoryResponse> {
		try {
			// Get total count of games for this user
			const totalGames = await this.gameHistoryRepository.count({
				where: { userId },
			});

			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: limit,
				skip: offset,
			});

			const games: GameHistoryEntry[] = gameHistory.map(game => {
				const difficulty = isRegisteredDifficulty(game.difficulty) ? game.difficulty : DifficultyLevel.MEDIUM;
				const restoredDifficulty = restoreGameDifficulty(difficulty);

				const { user: _user, difficulty: _difficulty, ...rest } = game;
				return {
					...rest,
					difficulty: restoredDifficulty,
					...(game.timeSpent !== undefined && { timeSpent: game.timeSpent }),
				};
			});

			return {
				userId,
				totalGames,
				games,
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
	 * Get game by ID
	 * @param gameId Game ID
	 * @returns Game details
	 */
	async getGameById(gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new BadRequestException(ERROR_CODES.GAME_ID_REQUIRED);
			}

		// Validate UUID format
		if (!UUID_REGEX.test(gameId)) {
			throw new BadRequestException(ERROR_CODES.INVALID_GAME_ID_FORMAT);
		}

		const game = await this.gameHistoryRepository.findOne({
			where: { id: gameId },
		});

			if (!game) {
				throw createNotFoundError('Game');
			}

			const { user: _user, ...rest } = game;
			return {
				...rest,
				gameId: game.id,
				successRate: (game.correctAnswers / game.gameQuestionCount) * 100,
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
	 * Get user credit balance
	 * @param userId User ID
	 * @returns User credit balance
	 */
	async getUserCreditBalance(userId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			return {
				userId: user.id,
				email: user.email,
				credits: user.credits ?? 0,
			};
		} catch (error) {
			logger.gameError('Failed to get user credit balance', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Add credits to user
	 * @param userId User ID
	 * @param credits Credits to add
	 * @returns Updated credit balance
	 */
	async addCredits(userId: string, credits: number) {
		try {
			logger.gameInfo('Adding credits to user', {
				userId,
				credits,
				reason: 'Game completion',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const newCredits = (user.credits ?? 0) + credits;
			await this.userRepository.update(userId, { credits: newCredits });

			return {
				userId: user.id,
				email: user.email,
				previousCredits: user.credits ?? 0,
				addedCredits: credits,
				newCredits,
			};
		} catch (error) {
			logger.gameError('Failed to add credits', {
				error: getErrorMessage(error),
				userId,
				credits,
			});
			throw error;
		}
	}

	/**
	 * Deduct credits from user
	 * @param userId User ID
	 * @param credits Credits to deduct
	 * @returns Updated credit balance
	 */
	async deductCredits(userId: string, credits: number) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const currentCredits = user.credits ?? 0;
			if (currentCredits < credits) {
				throw createValidationError('credits', 'number');
			}

			const newCredits = currentCredits - credits;
			await this.userRepository.update(userId, { credits: newCredits });

			return {
				userId: user.id,
				email: user.email,
				previousCredits: currentCredits,
				deductedCredits: credits,
				newCredits,
			};
		} catch (error) {
			logger.gameError('Failed to deduct credits', {
				error: getErrorMessage(error),
				userId,
				credits,
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
			defaultDifficulty?: GameDifficulty;
			defaultTopic?: string;
			questionsPerRequest?: number;
			timeLimit?: number;
			soundEnabled?: boolean;
			notifications?: boolean;
		}
	) {
		try {
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.set(
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
					error: result.error || ERROR_MESSAGES.general.UNKNOWN_ERROR,
				});
				throw createServerError('save game configuration', new Error(ERROR_CODES.FAILED_TO_SAVE_CONFIG));
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
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.get(configKey, isSavedGameConfiguration);

			if (result.success && result.data) {
				return {
					config: result.data,
				};
			}

			const defaultGameMode = DEFAULT_USER_PREFERENCES.game?.defaultGameMode ?? GameMode.QUESTION_LIMITED;
			const gameModeDefaults = GAME_MODES_CONFIG[defaultGameMode].defaults;
			const defaultConfig = {
				defaultDifficulty: DEFAULT_USER_PREFERENCES.game?.defaultDifficulty ?? DifficultyLevel.MEDIUM,
				defaultTopic: DEFAULT_USER_PREFERENCES.game?.defaultTopic ?? 'general',
				questionsPerRequest: DEFAULT_USER_PREFERENCES.game?.maxQuestionsPerGame ?? gameModeDefaults.maxQuestionsPerGame,
				timeLimit: DEFAULT_USER_PREFERENCES.game?.timeLimit ?? gameModeDefaults.timeLimit,
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
	async deleteGameHistory(userId: string, gameId: string): Promise<ClearOperationResponse> {
		try {
			const gameHistory = await this.gameHistoryRepository.findOne({
				where: { id: gameId, userId },
			});

			if (!gameHistory) {
				throw createNotFoundError('Game history');
			}

			await this.gameHistoryRepository.remove(gameHistory);

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				success: true,
				message: 'Game history deleted successfully',
				deletedCount: 1,
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
	async clearUserGameHistory(userId: string): Promise<ClearOperationResponse> {
		try {
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

			const deletedCount =
				typeof deleteResult.affected === 'number' && Number.isFinite(deleteResult.affected)
					? deleteResult.affected
					: count;

			// Clear cache
			await this.cacheService.delete(`game_history:${userId}`);

			return {
				success: true,
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
	async getAdminStatistics(): Promise<AdminGameStatistics> {
		try {
			const totalsRaw = await this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(*) AS INTEGER)', 'totalGames')
				.addSelect('CAST(AVG(game.score) AS DOUBLE PRECISION)', 'averageScore')
				.addSelect('CAST(MAX(game.score) AS INTEGER)', 'bestScore')
				.addSelect('CAST(SUM(game.game_question_count) AS INTEGER)', 'totalQuestionsAnswered')
				.addSelect('CAST(SUM(game.correctAnswers) AS INTEGER)', 'correctAnswers')
				.addSelect('MAX(game.createdAt)', 'lastActivity')
				.getRawOne<AdminStatisticsRaw>();

			const topicQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'topic', 'count', {
				topic: SQL_CONDITIONS.IS_NOT_NULL,
			});
			topicQueryBuilder.orderBy('count', 'DESC');
			const topicStatsRaw = await topicQueryBuilder.getRawMany<{ topic: string; count: number }>();

			const difficultyQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'difficulty', 'count', {
				difficulty: SQL_CONDITIONS.IS_NOT_NULL,
			});
			difficultyQueryBuilder.orderBy('count', 'DESC');
			const difficultyStatsRaw = await difficultyQueryBuilder.getRawMany<{ difficulty: string; count: number }>();
			const activePlayersQueryBuilder = this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'count');
			addDateRangeConditions(
				activePlayersQueryBuilder,
				'game',
				'createdAt',
				new Date(Date.now() - TIME_PERIODS_MS.DAY)
			);
			const activePlayersRaw = await activePlayersQueryBuilder.getRawOne<{ count: number }>();

			const totalGames = totalsRaw?.totalGames ?? 0;
			const totalQuestionsAnswered = totalsRaw?.totalQuestionsAnswered ?? 0;
			const correctAnswers = totalsRaw?.correctAnswers ?? 0;
			const accuracy = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;

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
				bestScore: Math.round(totalsRaw?.bestScore ?? 0),
				totalQuestionsAnswered,
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
	async clearAllGameHistory(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.gameHistoryRepository.count();

			if (totalBefore === 0) {
				// Clear cache even if no records found
				try {
					await this.cacheService.invalidatePattern('game_history:*');
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', 'game_history:*', {
						error: getErrorMessage(cacheError),
					});
				}
				return {
					success: true,
					message: 'No game history records found',
					deletedCount: 0,
				};
			}

			await this.gameHistoryRepository.clear();
			const deletedCount = totalBefore;

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
				success: true,
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
	 * Get all trivia questions (admin)
	 * @returns All trivia questions from database
	 */
	async getAllTriviaQuestions() {
		try {
			const questions = await this.triviaRepository.find({
				order: { createdAt: 'DESC' },
			});

			return {
				questions: questions.map(question => ({
					id: question.id,
					question: question.question,
					answers: question.answers,
					correctAnswerIndex: question.correctAnswerIndex,
					topic: question.topic,
					difficulty: question.difficulty,
					metadata: question.metadata,
					userId: question.userId,
					isCorrect: question.isCorrect,
					createdAt: question.createdAt,
					updatedAt: question.updatedAt,
				})),
				totalCount: questions.length,
			};
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				error: getErrorMessage(error),
			});
			throw createServerError('get all trivia questions', error);
		}
	}

	/**
	 * Clear all trivia questions (admin)
	 */
	async clearAllTrivia(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.triviaRepository.count();

			if (totalBefore === 0) {
				// Clear cache even if no records found
				try {
					await this.cacheService.invalidatePattern('trivia:*');
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', 'trivia:*', {
						error: getErrorMessage(cacheError),
					});
				}
				return {
					success: true,
					message: 'No trivia records found',
					deletedCount: 0,
				};
			}

			await this.triviaRepository.clear();
			const deletedCount = totalBefore;

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
				success: true,
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
}
