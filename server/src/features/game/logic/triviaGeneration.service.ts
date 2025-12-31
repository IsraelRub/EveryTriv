import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import {
	DifficultyLevel,
	ERROR_CODES,
	TriviaQuestionSource,
	ALLOWED_TRIVIA_SOURCES,
	defaultValidators,
	ProviderHealthStatus,
} from '@shared/constants';
import type { AiProviderHealth, AiProviderStats, GameDifficulty, TriviaAnswer, TriviaQuestionDetailsMetadata } from '@shared/types';
import { getErrorMessage, isNonEmptyString, isOneOf, normalizeStringArray } from '@shared/utils';
import { isCustomDifficulty, toDifficultyLevel } from '@shared/validation';
import { TriviaEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import type { PromptParams, ProviderTriviaGenerationResult, ServerTriviaQuestionInput } from '@internal/types';
import { createServerError, createValidationError } from '@internal/utils';
import { GroqTriviaProvider } from './providers/groq';

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
			// Try to generate question using Groq AI provider
			const providerResult = await this.groqProvider.generateTriviaQuestion(params);
			this.applyProviderMetadata(providerResult, params.difficulty);

			const question = this.convertAIQuestionToFormat(
				providerResult.question,
				params.topic,
				toDifficultyLevel(params.difficulty)
			);

			if (!question || !question.question || question.answers.length === 0) {
				throw createServerError('generate question with AI providers', new Error(ERROR_CODES.AI_PROVIDERS_FAILED));
			}

		const triviaEntity = this.convertQuestionToEntity(question, userId);
		const savedQuestion = await this.saveQuestion(triviaEntity);

		return savedQuestion;
		} catch (error) {
			logger.gameError('Failed to generate trivia question', {
				error: getErrorMessage(error),
				topic: params.topic,
				difficulty: params.difficulty,
				userId: userId ?? 'anonymous',
			});

			// Re-throw the error instead of falling back to mock
			throw createServerError('generate trivia question', error);
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
		excludeQuestionTexts: string[] = []
	): Promise<TriviaEntity[]> {
		try {
			const difficultyLevel = toDifficultyLevel(difficulty);
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
	async hasQuestionsForTopicAndDifficulty(topic: string, difficulty: GameDifficulty): Promise<boolean> {
		try {
			const difficultyLevel = toDifficultyLevel(difficulty);
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
		const isTriviaQuestionSource = isOneOf(ALLOWED_TRIVIA_SOURCES);
		const source: TriviaQuestionSource = isTriviaQuestionSource(base.source) ? base.source : TriviaQuestionSource.AI;
		const fallbackExplanation = isNonEmptyString(explanation) ? explanation : undefined;

		return {
			category: isNonEmptyString(base.category) ? base.category : topic,
			tags: normalizeStringArray(base.tags),
			source,
			providerName: isNonEmptyString(base.providerName) ? base.providerName : undefined,
			difficulty: base.difficulty ?? difficulty,
			difficultyScore: defaultValidators.number(base.difficultyScore) ? base.difficultyScore : undefined,
			customDifficultyDescription: isNonEmptyString(base.customDifficultyDescription)
				? base.customDifficultyDescription
				: undefined,
			generatedAt,
			language: isNonEmptyString(base.language) ? base.language : undefined,
			explanation: isNonEmptyString(base.explanation) ? base.explanation : fallbackExplanation,
			referenceUrls: normalizeStringArray(base.referenceUrls),
			hints: normalizeStringArray(base.hints),
			usageCount: defaultValidators.number(base.usageCount) ? base.usageCount : undefined,
			correctAnswerCount: defaultValidators.number(base.correctAnswerCount) ? base.correctAnswerCount : undefined,
			aiConfidenceScore: defaultValidators.number(base.aiConfidenceScore) ? base.aiConfidenceScore : undefined,
			safeContentScore: defaultValidators.number(base.safeContentScore) ? base.safeContentScore : undefined,
			flaggedReasons: normalizeStringArray(base.flaggedReasons),
			popularityScore: defaultValidators.number(base.popularityScore) ? base.popularityScore : undefined,
			averageAnswerTimeMs: defaultValidators.number(base.averageAnswerTimeMs) ? base.averageAnswerTimeMs : undefined,
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
			answers: questionData.answers.map((answer: string, index: number) => ({
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
				return existingQuestion;
				}
			}

		// Question doesn't exist, create new one
		const question = this.triviaRepository.create(triviaEntity);
		const savedQuestion = await this.triviaRepository.save(question);

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

	/**
	 * Get AI provider statistics
	 * @returns AI provider statistics
	 */
	getProviderStats(): AiProviderStats {
		const provider = this.groqProvider.provider;
		const totalRequests = provider.errorCount + provider.successCount;

		return {
			totalProviders: 1,
			currentProviderIndex: 0,
			providers: [provider.name],
			providerDetails: {
				[provider.name]: {
					status: provider.isAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.UNHEALTHY,
					requests: totalRequests,
					successes: provider.successCount,
					failures: provider.errorCount,
					successRate: totalRequests > 0 ? (provider.successCount / totalRequests) * 100 : 0,
					errorRate: totalRequests > 0 ? (provider.errorCount / totalRequests) * 100 : 0,
					averageResponseTime: provider.averageResponseTime,
					lastUsed: provider.isAvailable ? new Date().toISOString() : undefined,
				},
			},
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Get AI provider health status
	 * @returns AI provider health status
	 */
	getProviderHealth(): AiProviderHealth {
		const provider = this.groqProvider.provider;

		return {
			status: provider.isAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.UNHEALTHY,
			availableProviders: provider.isAvailable ? 1 : 0,
			totalProviders: 1,
			timestamp: new Date().toISOString(),
		};
	}
}
