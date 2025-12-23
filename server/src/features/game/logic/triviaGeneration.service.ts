import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import {
	DifficultyLevel,
	ERROR_CODES,
	TriviaQuestionReviewStatus,
	TriviaQuestionSource,
	VALID_TRIVIA_QUESTION_REVIEW_STATUSES,
	VALID_TRIVIA_SOURCES,
	VALIDATION_CONFIG,
} from '@shared/constants';
import type { GameDifficulty, TriviaAnswer, TriviaQuestionDetailsMetadata } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isCustomDifficulty, toDifficultyLevel } from '@shared/validation';

import { TriviaEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import type { PromptParams, ProviderTriviaGenerationResult, ServerTriviaQuestionInput } from '@internal/types';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import { GroqTriviaProvider } from './providers/groq';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isTriviaQuestionSource = (value: unknown): value is TriviaQuestionSource => {
	if (typeof value !== 'string') {
		return false;
	}
	for (const allowedSource of VALID_TRIVIA_SOURCES) {
		if (value === allowedSource) {
			return true;
		}
	}
	return false;
};

const isTriviaQuestionReviewStatus = (value: unknown): value is TriviaQuestionReviewStatus => {
	if (typeof value !== 'string') {
		return false;
	}
	for (const allowedStatus of VALID_TRIVIA_QUESTION_REVIEW_STATUSES) {
		if (value === allowedStatus) {
			return true;
		}
	}
	return false;
};

const normalizeStringArray = (value?: unknown): string[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const normalized = value.filter(isNonEmptyString);
	return normalized.length > 0 ? normalized : undefined;
};

/**
 * Service for generating trivia questions using AI
 * Handles question generation, validation, and storage
 */
@Injectable()
export class TriviaGenerationService {
	private readonly groqProvider: GroqTriviaProvider;

	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>
	) {
		this.groqProvider = new GroqTriviaProvider();
	}

	/**
	 * Generate trivia question using AI
	 *
	 * Process:
	 * 1. Generates question using AI providers
	 * 2. Before saving, checks if question already exists in database
	 * 3. If question exists, returns existing question instead of creating duplicate
	 * 4. If question doesn't exist, saves new question to database
	 *
	 * @param params Prompt parameters for the question
	 * @param userId User ID for personalization (optional)
	 * @returns Generated or existing trivia question entity
	 */
	async generateQuestion(params: PromptParams, userId?: string): Promise<TriviaEntity> {
		try {
			logger.gameTarget('Generating trivia question', {
				topic: params.topic,
				difficulty: params.difficulty,
				userId: userId || 'anonymous',
			});

			// Try to generate question using Groq AI provider
			const providerResult = await this.groqProvider.generateTriviaQuestion(params);
			this.applyProviderMetadata(providerResult, params.difficulty);

			const question = this.convertAIQuestionToFormat(
				providerResult.question,
				params.topic,
				params.mappedDifficulty ?? toDifficultyLevel(params.difficulty)
			);

			if (question) {
				// Save to database
				const triviaEntity = this.convertQuestionToEntity(question, userId);
				const savedQuestion = await this.saveQuestion(triviaEntity);

				logger.gameTarget('Question generated successfully', {
					questionId: savedQuestion.id,
					topic: params.topic,
					difficulty: params.difficulty,
				});

				return savedQuestion;
			}

			// If AI generation fails, throw an error instead of using mock
			throw createServerError('generate question with AI providers', new Error(ERROR_CODES.AI_PROVIDERS_FAILED));
		} catch (error) {
			logger.gameError('Failed to generate trivia question', {
				error: getErrorMessage(error),
				topic: params.topic,
				difficulty: params.difficulty,
				userId: userId || 'anonymous',
			});

			// Re-throw the error instead of falling back to mock
			throw createServerError('generate trivia question', error);
		}
	}

	/**
	 * Generate multiple trivia questions
	 * @param topic Topic for the questions
	 * @param difficulty Difficulty level
	 * @param count Number of questions to generate
	 * @param userId User ID (optional)
	 * @returns Array of generated questions
	 */
	async generateQuestions(topic: string, difficulty: GameDifficulty, count: number, userId?: string) {
		try {
			logger.gameTarget('Generating multiple trivia questions', {
				topic,
				difficulty,
				count,
				userId: userId || 'anonymous',
			});

			const questions = [];
			const excludeQuestions: string[] = [];

			for (let i = 0; i < count; i++) {
				try {
					const promptParams: PromptParams = {
						topic,
						difficulty,
						answerCount: VALIDATION_CONFIG.limits.ANSWER_COUNT.DEFAULT,
					};
					const generatedQuestion = await this.generateQuestion(promptParams, userId);
					questions.push(generatedQuestion);
					if (generatedQuestion.question) {
						const normalized = generatedQuestion.question.toLowerCase().trim();
						if (!excludeQuestions.some(existing => existing.toLowerCase().trim() === normalized)) {
							excludeQuestions.push(generatedQuestion.question);
						}
					}
				} catch (error) {
					logger.gameError('Failed to generate question', {
						error: getErrorMessage(error),
						attempt: i + 1,
						topic,
						difficulty,
					});
					// Continue with next question
				}
			}

			return questions;
		} catch (error) {
			logger.gameError('Failed to generate multiple trivia questions', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				count,
				userId: userId || 'anonymous',
			});
			throw error;
		}
	}

	/**
	 * Get existing question by ID
	 * @param questionId Question ID
	 * @returns Trivia question
	 */
	async getQuestionById(questionId: string) {
		try {
			logger.gameTarget('Getting question by ID', {
				questionId,
			});

			const question = await this.triviaRepository.findOne({ where: { id: questionId } });
			if (!question) {
				throw createNotFoundError('Question');
			}

			return {
				id: question.id,
				question: question.question,
				answers: question.answers,
				correctAnswerIndex: question.correctAnswerIndex,
				topic: question.topic,
				difficulty: question.difficulty,
				metadata: question.metadata,
				created_at: question.createdAt,
			};
		} catch (error) {
			logger.gameError('Failed to get question by ID', {
				error: getErrorMessage(error),
				questionId,
			});
			throw error;
		}
	}

	/**
	 * Get random questions by topic and difficulty
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @param count Number of questions
	 * @returns Array of questions
	 */
	async getRandomQuestions(topic: string, difficulty: GameDifficulty, count: number) {
		try {
			logger.gameTarget('Getting random questions', {
				topic,
				difficulty,
				count,
			});

			const queryBuilder = this.triviaRepository
				.createQueryBuilder('trivia')
				.where('trivia.topic = :topic', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty })
				.orderBy('RANDOM()')
				.limit(count);
			const questions = await queryBuilder.getMany();

			return questions.map(question => ({
				id: question.id,
				question: question.question,
				answers: question.answers,
				correctAnswerIndex: question.correctAnswerIndex,
				topic: question.topic,
				difficulty: question.difficulty,
				metadata: question.metadata,
				created_at: question.createdAt,
			}));
		} catch (error) {
			logger.gameError('Failed to get random questions', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				count,
			});
			throw error;
		}
	}

	/**
	 * Get available questions by topic and difficulty, excluding questions the user has already seen
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @param count Number of questions needed
	 * @param excludeQuestionTexts List of question texts to exclude (questions user has already seen)
	 * @returns Array of available questions
	 */
	async getAvailableQuestions(
		topic: string,
		difficulty: GameDifficulty,
		count: number,
		excludeQuestionTexts: string[] = [],
		mappedDifficulty?: DifficultyLevel
	): Promise<TriviaEntity[]> {
		try {
			logger.gameTarget('Getting available questions', {
				topic,
				difficulty,
				count,
				totalItems: excludeQuestionTexts.length,
			});

			const difficultyLevel = mappedDifficulty ?? toDifficultyLevel(difficulty);
			const queryBuilder = this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty: difficultyLevel });

			if (excludeQuestionTexts.length > 0) {
				const normalizedExcludes = excludeQuestionTexts.map(q => q.toLowerCase().trim());
				queryBuilder.andWhere('LOWER(TRIM(trivia.question)) NOT IN (:...excludes)', { excludes: normalizedExcludes });
			}

			queryBuilder.orderBy('RANDOM()').limit(count);

			const questions = await queryBuilder.getMany();

			logger.gameTarget('Found available questions', {
				topic,
				difficulty,
				requestedCount: count,
				actualCount: questions.length,
			});

			return questions;
		} catch (error) {
			logger.gameError('Failed to get available questions', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				count,
			});
			throw error;
		}
	}

	/**
	 * Check if questions exist in database for given topic and difficulty
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @returns True if questions exist, false otherwise
	 */
	async hasQuestionsForTopicAndDifficulty(
		topic: string,
		difficulty: GameDifficulty,
		mappedDifficulty?: DifficultyLevel
	): Promise<boolean> {
		try {
			// Use mappedDifficulty if available, otherwise normalize
			const difficultyLevel = mappedDifficulty ?? toDifficultyLevel(difficulty);
			const count = await this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty: difficultyLevel })
				.getCount();

			return count > 0;
		} catch (error) {
			logger.gameError('Failed to check if questions exist', {
				error: getErrorMessage(error),
				topic,
				difficulty,
			});
			return false;
		}
	}

	/**
	 * Convert AI question to our format
	 * @param aiQuestion AI generated question
	 * @param topic Topic
	 * @param difficulty Difficulty
	 * @returns Formatted question data
	 */
	private convertAIQuestionToFormat(
		aiQuestion: {
			question: string;
			answers: TriviaAnswer[];
			correctAnswerIndex: number;
			explanation?: string;
			metadata?: Partial<TriviaQuestionDetailsMetadata>;
		},
		topic: string,
		difficulty: DifficultyLevel
	): ServerTriviaQuestionInput {
		try {
			const metadata = this.normalizeMetadata(aiQuestion.metadata, topic, difficulty, aiQuestion.explanation);

			return {
				question: aiQuestion.question,
				answers: aiQuestion.answers.map(answer => answer.text),
				correctAnswerIndex: aiQuestion.correctAnswerIndex,
				topic,
				difficulty,
				metadata,
			};
		} catch (error) {
			logger.gameError('Failed to convert AI question format', {
				error: getErrorMessage(error),
				aiQuestion: JSON.stringify(aiQuestion),
			});
			throw createValidationError('AI question format', 'string');
		}
	}

	/**
	 * Normalize metadata for AI-generated questions
	 * @param metadataRaw Raw metadata from AI
	 * @param topic Topic
	 * @param difficulty Difficulty
	 * @param explanation Explanation from AI
	 * @returns Normalized metadata
	 */
	private normalizeMetadata(
		metadataInput: Partial<TriviaQuestionDetailsMetadata> | undefined,
		topic: string,
		difficulty: DifficultyLevel,
		explanation?: string
	): TriviaQuestionDetailsMetadata {
		const base = metadataInput ?? {};
		const generatedAt = isNonEmptyString(base.generatedAt) ? base.generatedAt : new Date().toISOString();
		const source: TriviaQuestionSource = isTriviaQuestionSource(base.source) ? base.source : TriviaQuestionSource.AI;
		const reviewStatus: TriviaQuestionReviewStatus | undefined = isTriviaQuestionReviewStatus(base.reviewStatus)
			? base.reviewStatus
			: undefined;
		const fallbackExplanation = isNonEmptyString(explanation) ? explanation : undefined;

		return {
			category: isNonEmptyString(base.category) ? base.category : topic,
			tags: normalizeStringArray(base.tags),
			source,
			providerName: isNonEmptyString(base.providerName) ? base.providerName : undefined,
			difficulty: base.difficulty ?? difficulty,
			difficultyScore:
				typeof base.difficultyScore === 'number' && Number.isFinite(base.difficultyScore)
					? base.difficultyScore
					: undefined,
			customDifficultyDescription: isNonEmptyString(base.customDifficultyDescription)
				? base.customDifficultyDescription
				: undefined,
			generatedAt,
			importedAt: isNonEmptyString(base.importedAt) ? base.importedAt : undefined,
			lastReviewedAt: isNonEmptyString(base.lastReviewedAt) ? base.lastReviewedAt : undefined,
			reviewStatus,
			language: isNonEmptyString(base.language) ? base.language : undefined,
			explanation: isNonEmptyString(base.explanation) ? base.explanation : fallbackExplanation,
			referenceUrls: normalizeStringArray(base.referenceUrls),
			hints: normalizeStringArray(base.hints),
			usageCount: typeof base.usageCount === 'number' && Number.isFinite(base.usageCount) ? base.usageCount : undefined,
			correctAnswerCount:
				typeof base.correctAnswerCount === 'number' && Number.isFinite(base.correctAnswerCount)
					? base.correctAnswerCount
					: undefined,
			aiConfidenceScore:
				typeof base.aiConfidenceScore === 'number' && Number.isFinite(base.aiConfidenceScore)
					? base.aiConfidenceScore
					: undefined,
			safeContentScore:
				typeof base.safeContentScore === 'number' && Number.isFinite(base.safeContentScore)
					? base.safeContentScore
					: undefined,
			flaggedReasons: normalizeStringArray(base.flaggedReasons),
			popularityScore:
				typeof base.popularityScore === 'number' && Number.isFinite(base.popularityScore)
					? base.popularityScore
					: undefined,
			averageAnswerTimeMs:
				typeof base.averageAnswerTimeMs === 'number' && Number.isFinite(base.averageAnswerTimeMs)
					? base.averageAnswerTimeMs
					: undefined,
			mappedDifficulty: base.mappedDifficulty ?? undefined,
		};
	}

	/**
	 * Convert question data to trivia entity
	 * @param questionData Question data
	 * @param userId User ID
	 * @returns Trivia entity
	 */
	private convertQuestionToEntity(questionData: ServerTriviaQuestionInput, userId?: string): DeepPartial<TriviaEntity> {
		return {
			question: questionData.question,
			answers: questionData.answers.map((answer, index) => ({
				text: answer,
				isCorrect: index === questionData.correctAnswerIndex,
			})),
			correctAnswerIndex: questionData.correctAnswerIndex,
			topic: questionData.topic,
			difficulty: questionData.difficulty,
			metadata: questionData.metadata,
			userId: userId ?? null,
			createdAt: new Date(),
		};
	}

	/**
	 * Check if question already exists in database
	 * @param questionText Question text
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @returns Existing question if found, null otherwise
	 */
	private async findExistingQuestion(
		questionText: string,
		topic: string,
		difficulty: DifficultyLevel
	): Promise<TriviaEntity | null> {
		try {
			const existingQuestion = await this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(TRIM(trivia.question)) = LOWER(TRIM(:question))', { question: questionText })
				.andWhere('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty })
				.getOne();

			return existingQuestion || null;
		} catch (error) {
			logger.gameError('Failed to check for existing question', {
				error: getErrorMessage(error),
				topic,
				difficulty,
			});
			return null;
		}
	}

	/**
	 * Save question to database with duplicate prevention
	 *
	 * Before saving a new question, checks if an identical question already exists in the database
	 * (same question text, topic, and difficulty). If found, returns the existing question instead
	 * of creating a duplicate entry.
	 *
	 * @param triviaEntity Trivia entity to save
	 * @returns Existing trivia entity if found, otherwise newly created and saved entity
	 */
	private async saveQuestion(triviaEntity: DeepPartial<TriviaEntity>): Promise<TriviaEntity> {
		try {
			// Check if question already exists in database
			if (triviaEntity.question && triviaEntity.topic && triviaEntity.difficulty) {
				const existingQuestion = await this.findExistingQuestion(
					triviaEntity.question,
					triviaEntity.topic,
					triviaEntity.difficulty
				);

				if (existingQuestion) {
					logger.gameTarget('Question already exists in database, returning existing', {
						questionId: existingQuestion.id,
						topic: existingQuestion.topic || 'unknown',
					});

					return existingQuestion;
				}
			}

			// Question doesn't exist, create new one
			const question = this.triviaRepository.create(triviaEntity);
			const savedQuestion = await this.triviaRepository.save(question);

			logger.gameTarget('Question saved to database', {
				questionId: savedQuestion.id,
				topic: savedQuestion.topic || 'unknown',
			});

			return savedQuestion;
		} catch (error) {
			logger.databaseError('Failed to save question to database', {
				error: getErrorMessage(error),
				topic: triviaEntity.topic || 'unknown',
			});
			throw error;
		}
	}

	private applyProviderMetadata(
		providerResult: ProviderTriviaGenerationResult,
		requestedDifficulty: GameDifficulty
	): void {
		if (!providerResult.mappedDifficulty) {
			return;
		}

		const metadata: Partial<TriviaQuestionDetailsMetadata> = providerResult.question.metadata ?? {};
		const hasCustomDescription =
			typeof metadata.customDifficultyDescription === 'string' &&
			metadata.customDifficultyDescription.trim().length > 0;

		providerResult.question.metadata = {
			...metadata,
			mappedDifficulty: providerResult.mappedDifficulty,
			customDifficultyDescription: isCustomDifficulty(requestedDifficulty)
				? hasCustomDescription
					? metadata.customDifficultyDescription
					: requestedDifficulty
				: metadata.customDifficultyDescription,
		};
	}
}
