import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	DEFAULT_USER_PREFERENCES,
	DifficultyLevel,
	ERROR_CODES,
	ERROR_MESSAGES,
	GameMode,
	GameStatus,
	HTTP_TIMEOUTS,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	VALID_GAME_STATUSES,
	VALIDATION_COUNT,
	VALIDATORS,
} from '@shared/constants';
import type {
	AnswerHistoryFallback,
	AnswerResult,
	ClearOperationResponse,
	GameData,
	GameDifficulty,
	GameHistoryEntry,
	GameHistoryResponse,
	GameSessionStartResponse,
	GameSessionValidationResponse,
	TriviaQuestion,
} from '@shared/types';
import {
	calculateAnswerScore,
	calculateSuccessRate,
	checkAnswerCorrectness,
	createAnswerHistory,
	createAnswerResult,
	getErrorMessage,
	normalizeGameData,
	toSavedGameConfiguration,
} from '@shared/utils';
import { isStringArray } from '@shared/utils/core/data.utils';
import { isSavedGameConfiguration } from '@shared/utils/domain';
import { isRegisteredDifficulty, isUuid, restoreGameDifficulty, toDifficultyLevel } from '@shared/validation';

import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService, StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type {
	CreditsParams,
	DeleteGameHistoryParams,
	GameSessionState,
	GetTriviaQuestionParams,
	PromptParams,
	SaveGameConfigParams,
	SaveGameHistoryParams,
	SubmitAnswerParams,
	UserGameHistoryParams,
} from '@internal/types';
import {
	createNotFoundError,
	createServerError,
	createValidationError,
	isGameSessionState,
	isValidGameDifficulty,
} from '@internal/utils';

import { UserStatsUpdateService } from '../analytics/services';
import { TriviaGenerationService } from './triviaGeneration';

@Injectable()
export class GameService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly cacheService: CacheService,
		private readonly storageService: StorageService,
		private readonly triviaGenerationService: TriviaGenerationService,
		private readonly userStatsUpdateService: UserStatsUpdateService
	) {}

	private async getUserRecentQuestionsForTopic(userId: string, topic: string, limit: number = 50): Promise<string[]> {
		try {
			const result = await this.gameHistoryRepository.query(
				`SELECT DISTINCT LOWER(TRIM(elem->>'question')) as question
				 FROM game_history gh,
				 LATERAL jsonb_array_elements(gh.questions_data) AS elem
				 WHERE gh.user_id = $1
				   AND LOWER(gh.topic) = LOWER($2)
				   AND gh.questions_data IS NOT NULL
				   AND jsonb_array_length(gh.questions_data) > 0
				   AND elem->>'question' IS NOT NULL
				 ORDER BY gh.created_at DESC
				 LIMIT $3`,
				[userId, topic, limit]
			);

			const questions: string[] = [];
			for (const row of result) {
				if (row.question && typeof row.question === 'string' && row.question.trim().length > 0) {
					questions.push(row.question);
				}
			}

			return questions;
		} catch (error) {
			logger.gameError('Failed to get user recent questions for topic', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				topic,
			});
			return [];
		}
	}

	private async getUserSeenQuestions(userId: string): Promise<Set<string>> {
		const cacheKey = SERVER_CACHE_KEYS.GAME_HISTORY.SEEN_QUESTIONS(userId);

		try {
			// Try to get from cache first
			const cachedResult = await this.cacheService.get<string[]>(cacheKey, isStringArray);
			if (cachedResult.success && cachedResult.data) {
				return new Set(cachedResult.data);
			}

			// If not in cache, query database with optimized query
			// Using GIN index on questions_data (if exists) for better performance
			// Get all distinct questions from user's entire game history to prevent repeats
			// Note: This query is cached for 1 hour to avoid performance issues
			const result = await this.gameHistoryRepository.query(
				`SELECT DISTINCT LOWER(TRIM(elem->>'question')) as question
				 FROM game_history gh,
				 LATERAL jsonb_array_elements(gh.questions_data) AS elem
				 WHERE gh.user_id = $1
				   AND gh.questions_data IS NOT NULL
				   AND jsonb_array_length(gh.questions_data) > 0
				   AND elem->>'question' IS NOT NULL`,
				[userId]
			);

			const seenQuestions = new Set<string>();
			for (const row of result) {
				if (row.question && typeof row.question === 'string' && row.question.trim().length > 0) {
					seenQuestions.add(row.question);
				}
			}

			// Cache the result for 1 hour
			const questionsArray = Array.from(seenQuestions);
			await this.cacheService.set(cacheKey, questionsArray, TIME_DURATIONS_SECONDS.HOUR);

			return seenQuestions;
		} catch (error) {
			logger.gameError('Failed to get user seen questions', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			return new Set<string>();
		}
	}

	async getTriviaQuestion(params: GetTriviaQuestionParams) {
		const { topic, difficulty, questionsPerRequest = 1, userId, answerCount } = params;
		// Note: questionsPerRequest is already validated and converted by TriviaRequestPipe
		// For unlimited mode (-1), we request questions in batches to allow continuous gameplay
		const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;

		// For unlimited mode, request questions in batches (MAX per request)
		// This allows continuous gameplay while respecting server limits
		// Note: In unlimited mode, the client should request 1 question at a time for subsequent requests
		// to avoid unnecessary credit deductions. The initial request uses -1 to indicate unlimited mode.
		const normalizedQuestionsPerRequest = questionsPerRequest === UNLIMITED ? MAX : Math.min(questionsPerRequest, MAX);

		if (questionsPerRequest > MAX && questionsPerRequest !== UNLIMITED) {
			logger.gameError(
				`Questions per request ${questionsPerRequest} exceeds limit ${MAX}, using ${normalizedQuestionsPerRequest}`,
				{
					requestCounts: {
						requested: questionsPerRequest,
					},
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
			const excludeQuestionsSet = new Set<string>(excludeQuestionTexts.map(q => q.toLowerCase().trim()));
			// All duplicate prevention happens here on the server—LLM prompts never manage exclusion lists.
			const appendExcludeQuestion = (value: string) => {
				const trimmed = value.trim();
				if (!trimmed) {
					return;
				}

				const normalized = trimmed.toLowerCase();
				excludeQuestionsSet.add(normalized);
			};
			const generationTimeout = HTTP_TIMEOUTS.QUESTION_GENERATION;
			const maxRetries = VALIDATION_COUNT.RETRY_ATTEMPTS.QUESTION_GENERATION;

			// Get the requested answer count (default to 4 if not specified)
			const requestedAnswerCount = answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
			const actualAnswerCount = Math.max(
				VALIDATION_COUNT.ANSWER_COUNT.MIN,
				Math.min(VALIDATION_COUNT.ANSWER_COUNT.MAX, requestedAnswerCount)
			);

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

				// Adjust answer count to match requested count
				let adjustedAnswers = [...questionEntity.answers];
				const currentAnswerCount = adjustedAnswers.length;

				if (currentAnswerCount > actualAnswerCount) {
					// If we have more answers than needed, keep the first (correct) answer
					// and randomly select (actualAnswerCount - 1) incorrect answers
					const correctAnswer = adjustedAnswers[0];
					if (!correctAnswer) {
						// Skip if no correct answer (should not happen, but TypeScript safety)
						continue;
					}
					const incorrectAnswers = adjustedAnswers.slice(1);
					// Shuffle and take only what we need
					const shuffledIncorrect = incorrectAnswers.sort(() => Math.random() - 0.5);
					adjustedAnswers = [correctAnswer, ...shuffledIncorrect.slice(0, actualAnswerCount - 1)];
				} else if (currentAnswerCount < actualAnswerCount) {
					// If we have fewer answers than needed, skip this question
					// It will be replaced by a newly generated question
					continue;
				}

				const {
					userId: _userId,
					user: _user,
					isCorrect: _isCorrect,
					difficulty: _difficulty,
					...rest
				} = questionEntity;
				questions.push({
					...rest,
					answers: adjustedAnswers,
					difficulty: restoredDifficulty,
				});

				appendExcludeQuestion(questionEntity.question);
			}

			// Generate new questions if we don't have enough
			const remainingCount = normalizedQuestionsPerRequest - questions.length;
			if (remainingCount > 0) {
				// Get recent questions from same topic across all difficulty levels to help LLM avoid duplicates (once per batch)
				// Limit to 50 questions to avoid overwhelming the prompt (each question ~50-100 chars = ~10-20 tokens)
				const baseRecentQuestions = userId ? await this.getUserRecentQuestionsForTopic(userId, topic, 50) : [];
				// Track questions generated in this batch to include in exclude list for subsequent generations
				const batchGeneratedQuestions: string[] = [];

				for (let i = 0; i < remainingCount; i++) {
					let question: TriviaQuestion | null = null;
					let retries = 0;

					while (retries < maxRetries && !question) {
						try {
							// Combine base recent questions with questions generated in this batch
							const excludeQuestions = [
								...baseRecentQuestions,
								...batchGeneratedQuestions,
								...Array.from(excludeQuestionsSet),
							]
								.slice(0, 50)
								.filter((q, idx, arr) => arr.indexOf(q) === idx); // Remove duplicates

							const promptParams: PromptParams = {
								topic,
								difficulty,
								answerCount: answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
								excludeQuestions: excludeQuestions.length > 0 ? excludeQuestions : undefined,
							};
							let timeoutId: NodeJS.Timeout | undefined = undefined;
							const timeoutPromise = new Promise<never>((_, reject) => {
								timeoutId = setTimeout(() => {
									reject(new Error(ERROR_CODES.QUESTION_GENERATION_TIMEOUT));
								}, generationTimeout);
							});

							const generationResult = await Promise.race([
								this.triviaGenerationService.generateQuestion(promptParams, userId),
								timeoutPromise,
							]);

							// Clear timeout if generation completed before timeout
							if (timeoutId !== undefined) {
								clearTimeout(timeoutId);
							}

							const questionText = generationResult.question.toLowerCase().trim();

							// Check if this question is a duplicate in the current batch or already seen by user
							if (excludeQuestionsSet.has(questionText)) {
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
								generationResult.difficulty,
								generationResult.metadata?.difficulty
							);

							const {
								userId: _userId,
								user: _user,
								isCorrect: _isCorrect,
								difficulty: _difficulty,
								...rest
							} = generationResult;
							question = {
								...rest,
								difficulty: restoredDifficulty,
							};

							appendExcludeQuestion(generationResult.question);
							batchGeneratedQuestions.push(generationResult.question);
							questions.push(question);
						} catch (error) {
							logger.gameError('Failed to generate question, retrying', {
								errorInfo: { message: getErrorMessage(error) },
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
					requestCounts: {
						requested: normalizedQuestionsPerRequest,
					},
					actualCount: questions.length,
					totalItems: availableQuestions.length,
				});
			}

			return {
				questions,
				fromCache: false,
			};
		} catch (error) {
			logger.gameError('Failed to generate trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
				topic,
				difficulty,
				requestCounts: {
					requested: normalizedQuestionsPerRequest,
				},
			});

			throw createServerError('generate trivia questions', error);
		}
	}

	async getQuestionById(questionId: string): Promise<TriviaQuestion> {
		try {
			if (!questionId || questionId.trim().length === 0) {
				throw new BadRequestException(ERROR_CODES.QUESTION_ID_REQUIRED);
			}

			// Validate UUID format
			if (!isUuid(questionId)) {
				throw new BadRequestException(ERROR_CODES.INVALID_QUESTION_ID_FORMAT);
			}

			const questionEntity = await this.triviaRepository.findOne({
				where: { id: questionId },
			});

			if (!questionEntity) {
				throw createNotFoundError('Question');
			}

			// Convert TriviaEntity to TriviaQuestion
			const restoredDifficulty = restoreGameDifficulty(questionEntity.difficulty, questionEntity.metadata?.difficulty);

			const { userId: _userId, user: _user, isCorrect: _isCorrect, difficulty: _difficulty, ...rest } = questionEntity;

			return {
				...rest,
				difficulty: restoredDifficulty,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw createServerError('get question', error);
		}
	}

	async startGameSession(
		userId: string,
		gameId: string,
		topic: string,
		difficulty: GameDifficulty,
		gameMode: GameMode
	): Promise<GameSessionStartResponse> {
		try {
			const sessionKey = SERVER_CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionState: GameSessionState = {
				gameId,
				userId,
				topic,
				difficulty,
				gameMode,
				startedAt: new Date().toISOString(),
				lastHeartbeat: new Date().toISOString(),
				questions: [],
				currentScore: 0,
				correctAnswers: 0,
				totalQuestions: 0,
				status: GameStatus.IN_PROGRESS,
			};

			const result = await this.storageService.set(sessionKey, sessionState, TIME_DURATIONS_SECONDS.HOUR);
			if (!result.success) {
				logger.gameError('Failed to start game session', {
					errorInfo: {
						message: result.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
					},
					userId,
					gameId,
				});
				throw createServerError('start game session', new Error(result.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR));
			}

			return {
				gameId,
				status: GameStatus.IN_PROGRESS,
			};
		} catch (error) {
			logger.gameError('Failed to start game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId,
			});
			throw createServerError('start game session', error);
		}
	}

	async submitAnswerToSession(
		params: SubmitAnswerParams & { gameId: string }
	): Promise<AnswerResult & { sessionScore: number }> {
		const { questionId, answer, userId, timeSpent, gameId } = params;
		try {
			if (!questionId || questionId.trim().length === 0) {
				throw new BadRequestException(ERROR_CODES.QUESTION_ID_REQUIRED);
			}

			if (!isUuid(questionId)) {
				throw new BadRequestException(ERROR_CODES.INVALID_QUESTION_ID_FORMAT);
			}

			const question = await this.getQuestionById(questionId);
			if (!question) {
				throw createNotFoundError('Question');
			}

			// Validate answer index is within the question's answer count
			const maxAnswerIndex = question.answers.length - 1;
			if (answer < 0 || answer > maxAnswerIndex) {
				throw new BadRequestException(
					`Invalid answer value: must be a number between 0 and ${maxAnswerIndex} (question has ${question.answers.length} answers)`
				);
			}

			const isCorrect = checkAnswerCorrectness(question, answer);

			const sessionKey = SERVER_CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionResult = await this.storageService.get(sessionKey);

			if (!sessionResult.success || !sessionResult.data) {
				throw createNotFoundError('Game session');
			}

			if (!isGameSessionState(sessionResult.data)) {
				throw createServerError('get game session', new Error('Invalid game session data structure'));
			}

			const session = sessionResult.data;

			const streak = session.questions.filter(q => q.isCorrect).length;
			const score = calculateAnswerScore(toDifficultyLevel(question.difficulty), timeSpent, streak, isCorrect);

			session.questions.push({
				questionId,
				answer,
				timeSpent,
				isCorrect,
				score,
			});
			session.currentScore += score;
			session.totalQuestions += 1;
			if (isCorrect) {
				session.correctAnswers += 1;
			}
			// Update heartbeat to mark session as active
			session.lastHeartbeat = new Date().toISOString();

			const updateResult = await this.storageService.set(sessionKey, session, TIME_DURATIONS_SECONDS.HOUR);
			if (!updateResult.success) {
				logger.gameError('Failed to update game session', {
					errorInfo: {
						message: updateResult.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
					},
					userId,
					gameId,
				});
			}

			return {
				...createAnswerResult(questionId, answer, isCorrect, timeSpent, score, 0),
				sessionScore: session.currentScore,
			};
		} catch (error) {
			throw createServerError('submit answer to session', error);
		}
	}

	async validateGameSession(userId: string, gameId: string): Promise<GameSessionValidationResponse> {
		try {
			const sessionKey = SERVER_CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionResult = await this.storageService.get(sessionKey);

			if (!sessionResult.success || !sessionResult.data) {
				return { isValid: false };
			}

			// Validate session structure
			if (!isGameSessionState(sessionResult.data)) {
				return { isValid: false };
			}

			const session = sessionResult.data;

			// Check if session is valid (has required fields and matches user/game)
			const isValid = session.gameId === gameId && session.userId === userId && VALID_GAME_STATUSES.has(session.status);

			if (isValid) {
				return { isValid: true, session: sessionResult.data };
			}

			return { isValid: false };
		} catch (error) {
			logger.gameError('Failed to validate game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId,
			});
			return { isValid: false };
		}
	}

	async finalizeGameSession(userId: string, gameId: string) {
		try {
			// Idempotency check: if game history already exists, return it
			const existingHistory = await this.gameHistoryRepository.findOne({
				where: {
					clientMutationId: gameId,
					userId,
				},
			});

			if (existingHistory) {
				logger.gameInfo('Game session already finalized (idempotent)', {
					userId,
					gameId: existingHistory.id,
					clientMutationId: gameId,
				});

				const incorrectAnswers = Math.max(0, existingHistory.gameQuestionCount - existingHistory.correctAnswers);
				return {
					...existingHistory,
					incorrectAnswers,
					successRate: calculateSuccessRate(existingHistory.gameQuestionCount, existingHistory.correctAnswers),
				};
			}

			const sessionKey = SERVER_CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionResult = await this.storageService.get(sessionKey);

			if (!sessionResult.success || !sessionResult.data) {
				throw createNotFoundError('Game session');
			}

			if (!isGameSessionState(sessionResult.data)) {
				throw createServerError('finalize game session', new Error('Invalid game session data structure'));
			}

			const session = sessionResult.data;

			// Calculate total time spent
			const totalTimeSpent = session.questions.reduce((sum, q) => sum + (q.timeSpent ?? 0), 0);

			// Create AnswerHistory from session questions
			// Handle cases where question might be deleted (fallback to text-based data)
			const answerHistory = await Promise.all(
				session.questions.map(async q => {
					try {
						const question = await this.getQuestionById(q.questionId);
						return createAnswerHistory(question, q.answer, q.isCorrect, q.timeSpent);
					} catch (error) {
						// Question was deleted or not found - create fallback data with text
						// Note: We don't have the original question text/answers, so we use indices as fallback
						// In a real scenario, you might want to store the question text in the session
						logger.gameError('Question not found when finalizing session', {
							errorInfo: { message: getErrorMessage(error) },
							questionId: q.questionId,
						});
						const fallbackData: AnswerHistoryFallback = {
							question: `Question ${q.questionId.substring(0, 8)}... (deleted)`,
							isCorrect: q.isCorrect,
							timeSpent: q.timeSpent,
							userAnswerText: `Answer ${String.fromCharCode(65 + (q.answer >= 0 ? q.answer : 0))}`,
							correctAnswerText: 'Unknown (question deleted)',
						};
						return fallbackData;
					}
				})
			);

			// Validate difficulty is a valid GameDifficulty
			if (!isValidGameDifficulty(session.difficulty)) {
				throw createServerError('finalize game session', new Error(`Invalid difficulty: ${session.difficulty}`));
			}

			// Create gameData from session
			const gameData: GameData = {
				userId,
				clientMutationId: gameId,
				score: session.currentScore,
				gameQuestionCount: session.totalQuestions,
				correctAnswers: session.correctAnswers,
				difficulty: session.difficulty,
				topic: session.topic,
				gameMode: session.gameMode,
				timeSpent: totalTimeSpent,
				creditsUsed: 0,
				answerHistory,
			};

			// Save to history (this will handle idempotency check)
			const savedHistory = await this.saveGameHistory({ userId, gameData });

			// Delete session after successful save
			await this.storageService.delete(sessionKey);

			return savedHistory;
		} catch (error) {
			logger.gameError('Failed to finalize game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId,
			});
			throw createServerError('finalize game session', error);
		}
	}

	async saveGameHistory(params: SaveGameHistoryParams) {
		const { userId, gameData } = params;
		const activeGameKey = `active_game:${userId}`;
		const result = await this.storageService.set(
			activeGameKey,
			{
				...gameData,
				startedAt: new Date().toISOString(),
				status: GameStatus.IN_PROGRESS,
			},
			TIME_DURATIONS_SECONDS.HOUR
		);

		if (!result.success) {
			logger.gameError('Failed to store active game session', {
				errorInfo: {
					message: result.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
				},
				userId,
			});
		}
		try {
			// Idempotency check: if clientMutationId is provided, check if game already exists
			if (gameData.clientMutationId) {
				const existing = await this.gameHistoryRepository.findOne({
					where: {
						clientMutationId: gameData.clientMutationId,
						userId,
					},
				});

				if (existing) {
					logger.gameInfo('Game history already exists (idempotent)', {
						userId,
						gameId: existing.id,
					});

					const incorrectAnswers = Math.max(0, existing.gameQuestionCount - existing.correctAnswers);
					return {
						...existing,
						incorrectAnswers,
						successRate: calculateSuccessRate(existing.gameQuestionCount, existing.correctAnswers),
					};
				}
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const normalizedData = normalizeGameData(gameData, { userId });
			const incorrectAnswers = Math.max(0, normalizedData.gameQuestionCount - normalizedData.correctAnswers);
			const gameHistory = this.gameHistoryRepository.create({
				userId,
				clientMutationId: gameData.clientMutationId,
				score: normalizedData.score,
				gameQuestionCount: normalizedData.gameQuestionCount,
				correctAnswers: normalizedData.correctAnswers,
				difficulty: normalizedData.difficulty,
				topic: normalizedData.topic,
				gameMode: normalizedData.gameMode,
				timeSpent: normalizedData.timeSpent,
				creditsUsed: normalizedData.creditsUsed,
				answerHistory: normalizedData.answerHistory,
			});

			const savedHistory = await this.gameHistoryRepository.save(gameHistory);

			// Update user statistics asynchronously (non-blocking)
			// Note: Cache invalidation is now handled inside updateStatsFromGame after stats are saved
			this.updateUserStatsAsync(userId, savedHistory);

			// Invalidate seen questions cache to include new questions from this game
			const seenQuestionsCacheKey = SERVER_CACHE_KEYS.GAME_HISTORY.SEEN_QUESTIONS(userId);
			this.invalidateSeenQuestionsCacheAsync(seenQuestionsCacheKey, userId);

			const { user: _user, answerHistory: _AnswerHistory, updatedAt: _updatedAt, ...rest } = savedHistory;
			return {
				...rest,
				incorrectAnswers,
				successRate: calculateSuccessRate(savedHistory.gameQuestionCount, savedHistory.correctAnswers),
			};
		} catch (error) {
			logger.gameError('Failed to save game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				score: gameData.score,
			});
			throw error;
		}
	}

	async getUserGameHistory(params: UserGameHistoryParams): Promise<GameHistoryResponse> {
		const { userId, limit = 50, offset = 0 } = params;
		try {
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getGameById(gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new BadRequestException(ERROR_CODES.GAME_ID_REQUIRED);
			}

			// Validate UUID format
			if (!isUuid(gameId)) {
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
				successRate: calculateSuccessRate(game.gameQuestionCount, game.correctAnswers),
			};
		} catch (error) {
			logger.gameError('Failed to get game by ID', {
				errorInfo: { message: getErrorMessage(error) },
				id: gameId,
			});
			throw error;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async addCredits(params: CreditsParams) {
		const { userId, credits } = params;
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				credits,
			});
			throw error;
		}
	}

	async deductCredits(params: CreditsParams) {
		const { userId, credits } = params;
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				credits,
			});
			throw error;
		}
	}

	async saveGameConfiguration(params: SaveGameConfigParams) {
		const { userId, config } = params;
		try {
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.set(
				configKey,
				{
					...config,
					updatedAt: new Date().toISOString(),
					userId,
				},
				TIME_DURATIONS_SECONDS.HOUR
			);

			if (!result.success) {
				logger.gameError('Failed to store game configuration', {
					userId,
					errorInfo: {
						message: result.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
					},
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
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGameConfiguration(userId: string) {
		try {
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.get(configKey, isSavedGameConfiguration);

			if (result.success && result.data) {
				return {
					config: result.data,
				};
			}

			const defaultConfig = toSavedGameConfiguration(
				DEFAULT_USER_PREFERENCES.game,
				DEFAULT_USER_PREFERENCES.soundEnabled
			);

			return {
				config: defaultConfig,
			};
		} catch (error) {
			logger.gameError('Failed to get game configuration', {
				userId,
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async deleteGameHistory(params: DeleteGameHistoryParams): Promise<ClearOperationResponse> {
		const { userId, gameId } = params;
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new BadRequestException(ERROR_CODES.GAME_ID_REQUIRED);
			}

			if (!isUuid(gameId)) {
				throw new BadRequestException(ERROR_CODES.INVALID_GAME_ID_FORMAT);
			}

			const gameHistory = await this.gameHistoryRepository.findOne({
				where: { id: gameId, userId },
			});

			if (!gameHistory) {
				throw createNotFoundError('Game history');
			}

			await this.gameHistoryRepository.remove(gameHistory);

			// Update user statistics asynchronously (non-blocking)
			this.removeUserStatsFromGameAsync(userId, gameHistory);

			await this.cacheService.delete(SERVER_CACHE_KEYS.GAME_HISTORY.USER(userId));

			return {
				success: true,
				message: 'Game history deleted successfully',
				deletedCount: 1,
			};
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				id: gameId,
			});
			throw error;
		}
	}

	async clearUserGameHistory(userId: string): Promise<ClearOperationResponse> {
		try {
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

			const deletedCount = VALIDATORS.number(deleteResult.affected) ? deleteResult.affected : count;

			// Reset user statistics asynchronously (non-blocking)
			this.resetUserStatsAsync(userId);

			await this.cacheService.delete(SERVER_CACHE_KEYS.GAME_HISTORY.USER(userId));

			return {
				success: true,
				message: 'All game history cleared successfully',
				deletedCount,
			};
		} catch (error) {
			logger.gameError('Failed to clear game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	private updateUserStatsAsync(userId: string, savedHistory: GameHistoryEntity): void {
		const handleUpdate = async () => {
			try {
				await this.userStatsUpdateService.updateStatsFromGame(userId, savedHistory);
			} catch (error) {
				logger.gameError('Failed to update user stats (async)', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
					gameId: savedHistory.id,
					note: 'Stats update failed but game was saved. Consider running consistency check.',
				});

				// Add to failed queue for potential retry
				const queueKey = `${userId}:${savedHistory.id}`;
				this.userStatsUpdateService.addToFailedQueue(queueKey, savedHistory);
			}
		};
		handleUpdate();
	}

	private invalidateSeenQuestionsCacheAsync(cacheKey: string, userId: string): void {
		const handleInvalidation = async () => {
			try {
				await this.cacheService.delete(cacheKey);
			} catch (error) {
				logger.cacheError('Failed to invalidate seen questions cache', cacheKey, {
					errorInfo: { message: getErrorMessage(error) },
					userId,
				});
			}
		};
		handleInvalidation();
	}

	private removeUserStatsFromGameAsync(userId: string, gameHistory: GameHistoryEntity): void {
		const handleRemove = async () => {
			try {
				await this.userStatsUpdateService.removeStatsFromGame(userId, gameHistory);
			} catch (error) {
				logger.gameError('Failed to remove user stats from deleted game', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
					gameId: gameHistory.id,
				});
			}
		};
		handleRemove();
	}

	private resetUserStatsAsync(userId: string): void {
		const handleReset = async () => {
			try {
				await this.userStatsUpdateService.resetUserStats(userId);
			} catch (error) {
				logger.gameError('Failed to reset user stats after clearing history', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
				});
			}
		};
		handleReset();
	}
}
