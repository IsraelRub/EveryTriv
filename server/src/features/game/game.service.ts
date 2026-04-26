import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
	CACHE_KEYS,
	DifficultyLevel,
	ERROR_MESSAGES,
	ErrorCode,
	GameMode,
	HTTP_TIMEOUTS,
	Locale,
	OUTPUT_LANGUAGE_LABELS,
	RETRY_LIMITS,
	SURPRISE_SCOPE_DEFAULT,
	SurpriseScope,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type {
	AnswerHistoryFallback,
	ClearOperationResponse,
	GameData,
	GameDifficulty,
	GameHistoryEntry,
	GameHistoryResponse,
	GameSessionStartResponse,
	GameSessionValidationResponse,
	SubmitAnswerResult,
	SurprisePickResult,
	TriviaAnswer,
	TriviaQuestion,
} from '@shared/types';
import {
	calculateAnswerScore,
	calculateScoreRate,
	clamp,
	createAnswerHistory,
	delay,
	getErrorMessage,
	isAnswerCorrect,
	isNonEmptyString,
	isStringArray,
	normalizeGameData,
	shuffle,
	sumBy,
	truncateWithEllipsis,
} from '@shared/utils';
import {
	isGameDifficulty,
	isLocale,
	isRegisteredDifficulty,
	isUuid,
	toDifficultyLevel,
	VALIDATORS,
} from '@shared/validation';

import { restoreGameDifficulty } from '@common/validation';
import { GAME_STATUSES, GameStatus } from '@internal/constants';
import { GameHistoryEntity, TriviaEntity, UserEntity } from '@internal/entities';
import { CacheService, StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type {
	DeleteGameHistoryParams,
	GetTriviaQuestionParams,
	PromptParams,
	SaveGameHistoryParams,
	ServerGameSessionState,
	SubmitAnswerParams,
	UserGameHistoryParams,
} from '@internal/types';
import { createNotFoundError, createServerError, isGameSessionState } from '@internal/utils';

import { UserStatsUpdateService } from '../analytics/services';
import { TopicDifficultyGateService, TriviaGenerationService } from './triviaGeneration';

const MAX_SESSION_EXCLUDE_QUESTION_TEXTS = VALIDATION_LENGTH.STRING_TRUNCATION.LONG_PREVIEW;

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
		private readonly topicDifficultyGateService: TopicDifficultyGateService,
		private readonly userStatsUpdateService: UserStatsUpdateService
	) {}

	private triviaEntityToTriviaQuestion(questionEntity: TriviaEntity): TriviaQuestion {
		const restoredDifficulty = restoreGameDifficulty(questionEntity.difficulty, questionEntity.metadata?.difficulty);
		const { userId: _userId, user: _user, isCorrect: _isCorrect, difficulty: _difficulty, ...rest } = questionEntity;
		return {
			...rest,
			difficulty: restoredDifficulty,
		};
	}

	private collectNonEmptyQuestionStrings(rows: { question: unknown }[]): string[] {
		const out: string[] = [];
		for (const row of rows) {
			if (isNonEmptyString(row.question)) {
				out.push(row.question);
			}
		}
		return out;
	}

	private async getUserRecentQuestionsForTopic(userId: string, topic: string, limit: number = 50): Promise<string[]> {
		try {
			const result = await this.gameHistoryRepository.query(
				`SELECT sub.question
				 FROM (
				   SELECT DISTINCT ON (LOWER(TRIM(elem->>'question')))
				     LOWER(TRIM(elem->>'question')) AS question,
				     gh.created_at
				   FROM game_history gh,
				   LATERAL jsonb_array_elements(gh.questions_data) AS elem
				   WHERE gh.user_id = $1
				     AND LOWER(gh.topic) = LOWER($2)
				     AND gh.questions_data IS NOT NULL
				     AND jsonb_array_length(gh.questions_data) > 0
				     AND elem->>'question' IS NOT NULL
				   ORDER BY LOWER(TRIM(elem->>'question')), gh.created_at DESC
				 ) sub
				 ORDER BY sub.created_at DESC
				 LIMIT $3`,
				[userId, topic, limit]
			);

			return this.collectNonEmptyQuestionStrings(result);
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
		const cacheKey = CACHE_KEYS.GAME_HISTORY.SEEN_QUESTIONS(userId);

		try {
			// Try to get from cache first
			const cachedResult = await this.cacheService.get<string[]>(cacheKey, isStringArray);
			if (cachedResult.success && cachedResult.data) {
				return new Set(cachedResult.data);
			}

			// Raw SQL: TypeORM QueryBuilder does not support LATERAL jsonb_array_elements(); expanding
			// questions_data (jsonb array) into one row per question must be done in PostgreSQL.
			// Result is cached for 1 hour to avoid repeated heavy queries.
			const result = await this.gameHistoryRepository.query(
				`SELECT DISTINCT LOWER(TRIM(elem->>'question')) as question
				 FROM game_history gh,
				 LATERAL jsonb_array_elements(gh.questions_data) AS elem
				 WHERE gh.user_id = $1
				   AND gh.created_at >= NOW() - INTERVAL '6 months'
				   AND gh.questions_data IS NOT NULL
				   AND jsonb_array_length(gh.questions_data) > 0
				   AND elem->>'question' IS NOT NULL`,
				[userId]
			);

			const seenQuestions = new Set(this.collectNonEmptyQuestionStrings(result));

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
		const {
			topic,
			difficulty,
			questionsPerRequest = 1,
			userId,
			answerCount = VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
			gameId,
			outputLanguage,
		} = params;
		// Note: questionsPerRequest is already validated and converted by TriviaRequestPipe
		// For unlimited mode (-1), we request questions in batches to allow continuous gameplay
		const { UNLIMITED, MAX, INITIAL_BATCH_UNLIMITED } = VALIDATION_COUNT.QUESTIONS;

		// For unlimited mode, use a smaller initial batch so the first response returns within client timeout.
		// Client can request more questions when needed. Using MAX (50) caused timeouts with Groq rate limits.
		const normalizedQuestionsPerRequest =
			questionsPerRequest === UNLIMITED ? INITIAL_BATCH_UNLIMITED : Math.min(questionsPerRequest, MAX);

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

			const sessionExcludeQuestionTexts: string[] = [];
			if (userId && gameId && isNonEmptyString(gameId) && isUuid(gameId)) {
				const sessionKeyForExclude = CACHE_KEYS.GAME.SESSION(userId, gameId);
				const sessionForExcludeResult = await this.storageService.get(sessionKeyForExclude);
				if (
					sessionForExcludeResult.success &&
					sessionForExcludeResult.data &&
					isGameSessionState(sessionForExcludeResult.data)
				) {
					const stored = sessionForExcludeResult.data.sessionExcludeQuestionTexts;
					if (Array.isArray(stored)) {
						for (const raw of stored) {
							if (isNonEmptyString(raw)) {
								sessionExcludeQuestionTexts.push(raw.toLowerCase().trim());
							}
						}
					}
				}
			}

			const mergedExcludeTexts = new Set<string>(userSeenQuestions);
			for (const t of sessionExcludeQuestionTexts) {
				mergedExcludeTexts.add(t);
			}
			const excludeQuestionTexts = Array.from(mergedExcludeTexts);

			const locale = isLocale(outputLanguage) ? outputLanguage : Locale.EN;

			// Check if questions exist in database for this topic, difficulty, and language
			const hasExistingQuestions = await this.triviaGenerationService.hasQuestionsForTopicAndDifficulty(
				topic,
				difficulty,
				locale
			);

			// Try to get existing questions first (only those matching requested language)
			let availableQuestions: TriviaEntity[] = [];
			if (hasExistingQuestions) {
				availableQuestions = await this.triviaGenerationService.getAvailableQuestions(
					topic,
					difficulty,
					normalizedQuestionsPerRequest * 2,
					excludeQuestionTexts,
					[],
					locale
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
			const maxRetries = RETRY_LIMITS.questionGeneration;
			const delayBetweenQuestionsMs = TIME_PERIODS_MS.TWO_SECONDS;

			const actualAnswerCount = clamp(
				answerCount,
				VALIDATION_COUNT.ANSWER_COUNT.MIN,
				VALIDATION_COUNT.ANSWER_COUNT.MAX
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
					// Keep the correct answer (by correctAnswerIndex) and randomly select (actualAnswerCount - 1) incorrect answers
					const correctIdx =
						questionEntity.correctAnswerIndex >= 0 && questionEntity.correctAnswerIndex < currentAnswerCount
							? questionEntity.correctAnswerIndex
							: questionEntity.answers.findIndex((a: TriviaAnswer) => a.isCorrect);
					const correctAnswer = correctIdx >= 0 ? adjustedAnswers[correctIdx] : undefined;
					if (!correctAnswer) {
						continue;
					}
					const incorrectAnswers = adjustedAnswers.filter((_, idx) => idx !== correctIdx);
					const shuffledIncorrect = shuffle(incorrectAnswers);
					adjustedAnswers = [correctAnswer, ...shuffledIncorrect.slice(0, actualAnswerCount - 1)];
				} else if (currentAnswerCount < actualAnswerCount) {
					// If we have fewer answers than needed, skip this question
					// It will be replaced by a newly generated question
					continue;
				}

				// Shuffle all answers so the correct one is not always in the same position (e.g. first)
				adjustedAnswers = shuffle(adjustedAnswers);
				const correctAnswerIndex = adjustedAnswers.findIndex((a: TriviaAnswer) => a.isCorrect) ?? 0;

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
					correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
				});

				appendExcludeQuestion(questionEntity.question);
			}

			// Generate new questions if we don't have enough
			const remainingCount = normalizedQuestionsPerRequest - questions.length;
			if (remainingCount > 0) {
				await this.topicDifficultyGateService.enforceTopicDifficultyGate({
					topic,
					difficulty,
					outputLanguage: locale,
				});
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
								.slice(0, VALIDATION_COUNT.QUESTIONS.MAX)
								.filter((q, idx, arr) => arr.indexOf(q) === idx); // Remove duplicates

							const promptParams: PromptParams = {
								topic,
								difficulty,
								answerCount: answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
								excludeQuestions: excludeQuestions.length > 0 ? excludeQuestions : undefined,
								outputLanguageLabel: OUTPUT_LANGUAGE_LABELS[locale],
								outputLanguage: locale,
							};
							let timeoutId: NodeJS.Timeout | undefined = undefined;
							const timeoutPromise = new Promise<never>((_, reject) => {
								timeoutId = setTimeout(() => {
									reject(new Error(ErrorCode.QUESTION_GENERATION_TIMEOUT));
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
							if (error instanceof BadRequestException) {
								throw error;
							}
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
					if (i < remainingCount - 1) {
						await delay(delayBetweenQuestionsMs);
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

			// Store question snapshots and session exclude texts when gameId and userId provided
			if (userId && gameId && isNonEmptyString(gameId) && isUuid(gameId) && questions.length > 0) {
				const sessionKey = CACHE_KEYS.GAME.SESSION(userId, gameId);
				const sessionResult = await this.storageService.get(sessionKey);
				if (sessionResult.success && sessionResult.data && isGameSessionState(sessionResult.data)) {
					const session = sessionResult.data;
					let sessionDirty = false;

					const newSnapshots: Record<string, { correctAnswerIndex: number }> = {};
					for (const q of questions) {
						if (q?.id && VALIDATORS.number(q.correctAnswerIndex)) {
							newSnapshots[q.id] = { correctAnswerIndex: q.correctAnswerIndex };
						}
					}
					if (Object.keys(newSnapshots).length > 0) {
						session.questionSnapshots = { ...(session.questionSnapshots ?? {}), ...newSnapshots };
						sessionDirty = true;
					}

					const newTextsForSession = questions
						.map(q => (isNonEmptyString(q?.question) ? q.question.trim().toLowerCase() : ''))
						.filter((t): t is string => t.length > 0);
					if (newTextsForSession.length > 0) {
						const prevTexts = session.sessionExcludeQuestionTexts ?? [];
						const combined = [...prevTexts, ...newTextsForSession];
						const deduped: string[] = [];
						const seenText = new Set<string>();
						for (const t of combined) {
							if (!seenText.has(t)) {
								seenText.add(t);
								deduped.push(t);
							}
						}
						session.sessionExcludeQuestionTexts = deduped.slice(-MAX_SESSION_EXCLUDE_QUESTION_TEXTS);
						sessionDirty = true;
					}

					if (sessionDirty) {
						session.lastHeartbeat = new Date().toISOString();
						await this.storageService.set(sessionKey, session, TIME_DURATIONS_SECONDS.HOUR);
					}
				}
			}

			return {
				questions,
				fromCache: false,
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
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

	async validateTriviaTopicForClient(params: {
		topic: string;
		difficulty: GameDifficulty;
		outputLanguage: Locale;
	}): Promise<{ ok: true }> {
		return this.topicDifficultyGateService.validateTopicDifficultyForClient(params);
	}

	async getQuestionById(questionId: string): Promise<TriviaQuestion> {
		try {
			if (!isNonEmptyString(questionId)) {
				throw new BadRequestException(ErrorCode.QUESTION_ID_REQUIRED);
			}

			// Validate UUID format
			if (!isUuid(questionId)) {
				throw new BadRequestException(ErrorCode.INVALID_QUESTION_ID_FORMAT);
			}

			const questionEntity = await this.triviaRepository.findOne({
				where: { id: questionId },
			});

			if (!questionEntity) {
				throw createNotFoundError('Question');
			}

			return this.triviaEntityToTriviaQuestion(questionEntity);
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
			const sessionKey = CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionState: ServerGameSessionState = {
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

	private async getTopicsPlayedByUser(userId: string): Promise<string[]> {
		try {
			const rows = await this.gameHistoryRepository
				.createQueryBuilder('gh')
				.select('gh.topic', 'topic')
				.distinct(true)
				.where('gh.userId = :userId', { userId })
				.andWhere("TRIM(gh.topic) != ''")
				.getRawMany<{ topic: string }>();
			return rows.map(r => r.topic).filter(isNonEmptyString);
		} catch (error) {
			logger.gameError('Failed to get topics played by user', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			return [];
		}
	}

	async getSurprisePick(userId: string, scope?: SurpriseScope, locale?: Locale): Promise<SurprisePickResult> {
		const excludeTopics = await this.getTopicsPlayedByUser(userId);
		return this.triviaGenerationService.getSurprisePick({
			excludeTopics,
			scope: scope ?? SURPRISE_SCOPE_DEFAULT,
			locale,
		});
	}

	async submitAnswerToSession(params: SubmitAnswerParams & { gameId: string }): Promise<SubmitAnswerResult> {
		const { questionId, answer, userId, timeSpent, gameId } = params;
		try {
			if (!isNonEmptyString(questionId)) {
				throw new BadRequestException(ErrorCode.QUESTION_ID_REQUIRED);
			}

			if (!isUuid(questionId)) {
				throw new BadRequestException(ErrorCode.INVALID_QUESTION_ID_FORMAT);
			}

			const question = await this.getQuestionById(questionId);
			if (!question) {
				throw createNotFoundError('Question');
			}

			// Validate answer index is within the question's answer count
			const maxAnswerIndex = question.answers.length - 1;
			if (answer < 0 || answer > maxAnswerIndex) {
				throw new BadRequestException(
					ERROR_MESSAGES.game.INVALID_ANSWER_INDEX_SERVER(maxAnswerIndex, question.answers.length)
				);
			}

			const sessionKey = CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionResult = await this.storageService.get(sessionKey);

			if (!sessionResult.success || !sessionResult.data) {
				throw createNotFoundError('Game session');
			}

			if (!isGameSessionState(sessionResult.data)) {
				throw createServerError('get game session', new Error(ERROR_MESSAGES.game.INVALID_GAME_SESSION_DATA_STRUCTURE));
			}

			const session = sessionResult.data;

			// Use snapshot correctAnswerIndex when available (matches client shuffle); otherwise fallback to question from DB
			const snapshot = session.questionSnapshots?.[questionId];
			const isCorrect =
				snapshot !== undefined && VALIDATORS.number(snapshot.correctAnswerIndex)
					? answer === snapshot.correctAnswerIndex
					: isAnswerCorrect(question, answer);

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
				questionId,
				userAnswerIndex: answer >= 0 ? answer : -1,
				isCorrect,
				timeSpent,
				scoreEarned: score,
				totalScore: 0,
				feedback: isCorrect ? 'Correct answer!' : 'Wrong answer. Try again!',
				sessionScore: session.currentScore,
			};
		} catch (error) {
			throw createServerError('submit answer to session', error);
		}
	}

	async validateGameSession(userId: string, gameId: string): Promise<GameSessionValidationResponse> {
		try {
			const sessionKey = CACHE_KEYS.GAME.SESSION(userId, gameId);
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
			const isValid = session.gameId === gameId && session.userId === userId && GAME_STATUSES.has(session.status);

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
					successRate: calculateScoreRate(existingHistory.score, existingHistory.gameQuestionCount),
				};
			}

			const sessionKey = CACHE_KEYS.GAME.SESSION(userId, gameId);
			const sessionResult = await this.storageService.get(sessionKey);

			if (!sessionResult.success || !sessionResult.data) {
				throw createNotFoundError('Game session');
			}

			if (!isGameSessionState(sessionResult.data)) {
				throw createServerError(
					'finalize game session',
					new Error(ERROR_MESSAGES.game.INVALID_GAME_SESSION_DATA_STRUCTURE)
				);
			}

			const session = sessionResult.data;

			// Calculate total time spent
			const totalTimeSpent = sumBy(session.questions, q => q.timeSpent ?? 0);

			// Batch-load trivia rows once (avoids N+1 selects per session question)
			const rawQuestionIds = session.questions.map(q => q.questionId);
			const uniqueValidIds = [...new Set(rawQuestionIds.filter((id): id is string => isUuid(id)))];
			const questionEntities =
				uniqueValidIds.length > 0
					? await this.triviaRepository.find({
							where: { id: In(uniqueValidIds) },
						})
					: [];
			const questionById = new Map(
				questionEntities.map(entity => [entity.id, this.triviaEntityToTriviaQuestion(entity)])
			);

			const answerHistory = session.questions.map(q => {
				const question = questionById.get(q.questionId);
				if (question) {
					return createAnswerHistory(question, q.answer, q.isCorrect, q.timeSpent);
				}
				logger.gameError('Question not found when finalizing session', {
					errorInfo: { message: 'missing_or_invalid_question_id' },
					questionId: q.questionId,
				});
				const fallbackData: AnswerHistoryFallback = {
					question: `Question ${truncateWithEllipsis(q.questionId, VALIDATION_LENGTH.STRING_TRUNCATION.ID_PREVIEW)} (deleted)`,
					isCorrect: q.isCorrect,
					timeSpent: q.timeSpent,
					userAnswerText: `Answer ${String.fromCharCode(65 + (q.answer >= 0 ? q.answer : 0))}`,
					correctAnswerText: 'Unknown (question deleted)',
				};
				return fallbackData;
			});

			// Validate difficulty is a valid GameDifficulty
			if (!isGameDifficulty(session.difficulty)) {
				throw createServerError(
					'finalize game session',
					new Error(ERROR_MESSAGES.validation.INVALID_DIFFICULTY_LEVEL(session.difficulty))
				);
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
						successRate: calculateScoreRate(existing.score, existing.gameQuestionCount),
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

			// Update user statistics synchronously so leaderboards/stats stay consistent with game_history
			try {
				await this.userStatsUpdateService.updateStatsFromGame(userId, savedHistory);
			} catch (error) {
				logger.gameError('Failed to update user stats after save game', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
					gameId: savedHistory.id,
					note: 'Game was saved. Entry already kept in retry queue by UserStatsUpdateService.',
				});
			}

			// Invalidate seen questions cache to include new questions from this game
			const seenQuestionsCacheKey = CACHE_KEYS.GAME_HISTORY.SEEN_QUESTIONS(userId);
			this.invalidateSeenQuestionsCacheAsync(seenQuestionsCacheKey, userId);

			const { user: _user, answerHistory: _AnswerHistory, updatedAt: _updatedAt, ...rest } = savedHistory;
			return {
				...rest,
				incorrectAnswers,
				successRate: calculateScoreRate(savedHistory.score, savedHistory.gameQuestionCount),
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
		const { userId, limit = VALIDATION_COUNT.LEADERBOARD.DEFAULT, offset = 0 } = params;
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
			if (!isNonEmptyString(gameId)) {
				throw new BadRequestException(ErrorCode.GAME_ID_REQUIRED);
			}

			// Validate UUID format
			if (!isUuid(gameId)) {
				throw new BadRequestException(ErrorCode.INVALID_GAME_ID_FORMAT);
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
				successRate: calculateScoreRate(game.score, game.gameQuestionCount),
			};
		} catch (error) {
			logger.gameError('Failed to get game by ID', {
				errorInfo: { message: getErrorMessage(error) },
				id: gameId,
			});
			throw error;
		}
	}

	async deleteGameHistory(params: DeleteGameHistoryParams): Promise<ClearOperationResponse> {
		const { userId, gameId } = params;
		try {
			if (!isNonEmptyString(gameId)) {
				throw new BadRequestException(ErrorCode.GAME_ID_REQUIRED);
			}

			if (!isUuid(gameId)) {
				throw new BadRequestException(ErrorCode.INVALID_GAME_ID_FORMAT);
			}

			const gameHistory = await this.gameHistoryRepository.findOne({
				where: { id: gameId, userId },
			});

			if (!gameHistory) {
				throw createNotFoundError('Game history');
			}

			await this.gameHistoryRepository.remove(gameHistory);

			try {
				await this.userStatsUpdateService.removeStatsFromGame(userId, gameHistory);
			} catch (error) {
				logger.gameError('Failed to remove user stats after delete game', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
					gameId: gameHistory.id,
				});
			}

			await this.cacheService.delete(CACHE_KEYS.GAME_HISTORY.USER(userId));

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

			try {
				await this.userStatsUpdateService.resetUserStats(userId);
			} catch (error) {
				logger.gameError('Failed to reset user stats after clear history', {
					errorInfo: { message: getErrorMessage(error) },
					userId,
				});
			}

			await this.cacheService.delete(CACHE_KEYS.GAME_HISTORY.USER(userId));

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
}
