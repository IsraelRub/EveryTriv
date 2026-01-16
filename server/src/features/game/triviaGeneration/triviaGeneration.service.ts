import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import {
	ALLOWED_TRIVIA_SOURCES,
	DifficultyLevel,
	ERROR_CODES,
	ProviderHealthStatus,
	TriviaQuestionSource,
	VALIDATORS,
} from '@shared/constants';
import type {
	AiProviderHealth,
	AiProviderStats,
	GameDifficulty,
	TriviaAnswer,
	TriviaQuestion,
	TriviaQuestionDetailsMetadata,
} from '@shared/types';
import { getErrorMessage, isNonEmptyString, isOneOf, normalizeStringArray } from '@shared/utils';
import { isCustomDifficulty, toDifficultyLevel } from '@shared/validation';

import { TriviaEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import type { PromptParams, ProviderTriviaGenerationResult } from '@internal/types';
import { createServerError, createValidationError } from '@internal/utils';

import { GroqTriviaProvider } from './providers/groq';

@Injectable()
export class TriviaGenerationService {
	private readonly groqProvider: GroqTriviaProvider;

	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>
	) {
		this.groqProvider = new GroqTriviaProvider();
	}

	async generateQuestion(params: PromptParams, userId?: string): Promise<TriviaEntity> {
		try {
			// Try to generate question using Groq AI provider
			const providerResult = await this.groqProvider.generateTriviaQuestion(params);
			this.applyProviderMetadata(providerResult, params.difficulty);

			const question = this.convertAIQuestionToFormat(providerResult.question, params.topic, params.difficulty);

			if (!question?.question || question.answers.length === 0) {
				throw createServerError('generate question with AI providers', new Error(ERROR_CODES.AI_PROVIDERS_FAILED));
			}

			const triviaEntity = this.convertQuestionToEntity(question, userId);
			const savedQuestion = await this.saveQuestion(triviaEntity);

			return savedQuestion;
		} catch (error) {
			logger.gameError('Failed to generate trivia question', {
				errorInfo: { message: getErrorMessage(error) },
				topic: params.topic,
				difficulty: params.difficulty,
				userId: userId ?? 'anonymous',
			});

			// Re-throw the error instead of falling back to mock
			throw createServerError('generate trivia question', error);
		}
	}

	async getAvailableQuestions(
		topic: string,
		difficulty: GameDifficulty,
		count: number,
		excludeQuestionTexts: string[] = [],
		excludeQuestionIds: string[] = []
	): Promise<TriviaEntity[]> {
		try {
			const difficultyLevel = toDifficultyLevel(difficulty);
			const queryBuilder = this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', {
					difficulty: difficultyLevel,
				});

			if (excludeQuestionTexts.length > 0) {
				const normalizedExcludes = excludeQuestionTexts.map(q => q.toLowerCase().trim());
				queryBuilder.andWhere('LOWER(TRIM(trivia.question)) NOT IN (:...excludes)', { excludes: normalizedExcludes });
			}

			if (excludeQuestionIds.length > 0) {
				queryBuilder.andWhere('trivia.id NOT IN (:...excludeIds)', {
					excludeIds: excludeQuestionIds,
				});
			}

			queryBuilder.orderBy('RANDOM()').limit(count);

			const questions = await queryBuilder.getMany();

			return questions;
		} catch (error) {
			logger.gameError('Failed to get available questions', {
				errorInfo: { message: getErrorMessage(error) },
				topic,
				difficulty,
				count,
			});
			throw error;
		}
	}

	async hasQuestionsForTopicAndDifficulty(topic: string, difficulty: GameDifficulty): Promise<boolean> {
		try {
			const difficultyLevel = toDifficultyLevel(difficulty);
			const count = await this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', {
					difficulty: difficultyLevel,
				})
				.getCount();

			return count > 0;
		} catch (error) {
			logger.gameError('Failed to check if questions exist', {
				errorInfo: { message: getErrorMessage(error) },
				topic,
				difficulty,
			});
			return false;
		}
	}

	private convertAIQuestionToFormat(
		aiQuestion: {
			question: string;
			answers: TriviaAnswer[];
			explanation?: string;
			metadata?: Partial<TriviaQuestionDetailsMetadata>;
		},
		topic: string,
		difficulty: GameDifficulty
	): Omit<TriviaQuestion, 'id' | 'createdAt' | 'updatedAt'> {
		try {
			const difficultyLevel = toDifficultyLevel(difficulty);
			const metadata = this.normalizeMetadata(aiQuestion.metadata, topic, difficultyLevel, aiQuestion.explanation);

			// Calculate correctAnswerIndex from answers
			const correctAnswerIndex = aiQuestion.answers.findIndex(answer => answer.isCorrect);
			if (correctAnswerIndex === -1) {
				throw createValidationError('AI question format', 'No correct answer found in answers array');
			}

			return {
				question: aiQuestion.question,
				answers: aiQuestion.answers,
				correctAnswerIndex,
				topic,
				difficulty,
				metadata,
			};
		} catch (error) {
			logger.gameError('Failed to convert AI question format', {
				errorInfo: { message: getErrorMessage(error) },
				aiQuestion: JSON.stringify(aiQuestion),
			});
			throw createValidationError('AI question format', 'string');
		}
	}

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
			difficultyScore: VALIDATORS.number(base.difficultyScore) ? base.difficultyScore : undefined,
			customDifficultyDescription: isNonEmptyString(base.customDifficultyDescription)
				? base.customDifficultyDescription
				: undefined,
			generatedAt,
			language: isNonEmptyString(base.language) ? base.language : undefined,
			explanation: isNonEmptyString(base.explanation) ? base.explanation : fallbackExplanation,
			referenceUrls: normalizeStringArray(base.referenceUrls),
			hints: normalizeStringArray(base.hints),
			usageCount: VALIDATORS.number(base.usageCount) ? base.usageCount : undefined,
			correctAnswerCount: VALIDATORS.number(base.correctAnswerCount) ? base.correctAnswerCount : undefined,
			aiConfidenceScore: VALIDATORS.number(base.aiConfidenceScore) ? base.aiConfidenceScore : undefined,
			safeContentScore: VALIDATORS.number(base.safeContentScore) ? base.safeContentScore : undefined,
			flaggedReasons: normalizeStringArray(base.flaggedReasons),
			popularityScore: VALIDATORS.number(base.popularityScore) ? base.popularityScore : undefined,
			averageAnswerTimeMs: VALIDATORS.number(base.averageAnswerTimeMs) ? base.averageAnswerTimeMs : undefined,
			mappedDifficulty: base.mappedDifficulty ?? undefined,
		};
	}

	private convertQuestionToEntity(
		questionData: Omit<TriviaQuestion, 'id' | 'createdAt' | 'updatedAt'>,
		userId?: string
	): DeepPartial<TriviaEntity> {
		// Use correctAnswerIndex from questionData if available, otherwise calculate from answers
		const correctAnswerIndex =
			questionData.correctAnswerIndex !== undefined && questionData.correctAnswerIndex >= 0
				? questionData.correctAnswerIndex
				: questionData.answers.findIndex(answer => answer.isCorrect);
		return {
			question: questionData.question,
			answers: questionData.answers,
			correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
			topic: questionData.topic,
			difficulty: toDifficultyLevel(questionData.difficulty),
			metadata: questionData.metadata,
			userId: userId ?? null,
			createdAt: new Date(),
		};
	}

	private async findExistingQuestion(
		questionText: string,
		topic: string,
		difficulty: DifficultyLevel
	): Promise<TriviaEntity | null> {
		try {
			const existingQuestion = await this.triviaRepository
				.createQueryBuilder('trivia')
				.where('LOWER(TRIM(trivia.question)) = LOWER(TRIM(:question))', {
					question: questionText,
				})
				.andWhere('LOWER(trivia.topic) = LOWER(:topic)', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty })
				.getOne();

			return existingQuestion ?? null;
		} catch (error) {
			logger.gameError('Failed to check for existing question', {
				errorInfo: { message: getErrorMessage(error) },
				topic,
				difficulty,
			});
			return null;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
				topic: triviaEntity.topic ?? 'unknown',
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
