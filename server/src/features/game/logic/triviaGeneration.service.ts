import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { DifficultyLevel } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type {
	GameDifficulty,
	TriviaAnswer,
	TriviaQuestionDetailsMetadata,
	TriviaQuestionReviewStatus,
	TriviaQuestionSource,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { TriviaEntity } from '@internal/entities';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import type { ServerTriviaQuestionInput } from '@features/game/types';

import { AiProvidersService } from './providers/management';

const ALLOWED_TRIVIA_SOURCES: TriviaQuestionSource[] = ['ai', 'user', 'imported', 'seeded', 'system'];
const ALLOWED_REVIEW_STATUSES: TriviaQuestionReviewStatus[] = ['pending', 'approved', 'rejected', 'flagged'];

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

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
	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly aiProvidersService: AiProvidersService
	) {}

	/**
	 * Generate trivia question
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param userId User ID for personalization
	 * @returns Generated trivia question
	 */
	async generateQuestion(topic: string, difficulty: GameDifficulty, userId?: string): Promise<TriviaEntity> {
		try {
			logger.gameTarget('Generating trivia question', {
				topic,
				difficulty,
				userId: userId || 'anonymous',
			});

			// Try to generate question using AI
			const aiQuestion = await this.aiProvidersService.generateQuestion(topic, difficulty);
			const question = this.convertAIQuestionToFormat(aiQuestion, topic, toDifficultyLevel(difficulty));

			if (question) {
				// Save to database
				const triviaEntity = this.convertQuestionToEntity(question, userId);
				const savedQuestion = await this.saveQuestion(triviaEntity);

				logger.gameTarget('Question generated successfully', {
					questionId: savedQuestion.id,
					topic,
					difficulty,
				});

				return savedQuestion;
			}

			// If AI generation fails, throw an error instead of using mock
			throw createServerError('generate question with AI providers', new Error('AI providers failed'));
		} catch (error) {
			logger.gameError('Failed to generate trivia question', {
				error: getErrorMessage(error),
				topic,
				difficulty,
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
			for (let i = 0; i < count; i++) {
				try {
					const question = await this.generateQuestion(topic, difficulty, userId);
					questions.push(question);
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
	 * Generate deterministic fallback questions when AI providers are unavailable
	 * @param topic Topic for the questions
	 * @param difficulty Difficulty level
	 * @param count Number of questions requested
	 * @param userId (Optional) user identifier for analytics consistency
	 * @returns Array of stored fallback trivia entities
	 */
	async generateFallbackQuestions(topic: string, difficulty: GameDifficulty, count: number, userId?: string) {
		const normalizedTopic = topic?.trim().length ? topic.trim() : 'general knowledge';
		const difficultyLevel = toDifficultyLevel(difficulty);
		const totalQuestions = Math.max(1, count);
		const fallbackQuestions: TriviaEntity[] = [];

		for (let index = 0; index < totalQuestions; index++) {
			const fallbackQuestionData = this.buildFallbackQuestionData(normalizedTopic, difficultyLevel, index);
			const triviaEntity = this.convertQuestionToEntity(fallbackQuestionData, userId);
			const savedQuestion = await this.saveQuestion(triviaEntity);
			fallbackQuestions.push(savedQuestion);
		}

		return fallbackQuestions;
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

			const { createRandomQuery } = await import('../../../common/queries');
			const queryBuilder = createRandomQuery(this.triviaRepository, 'trivia', { topic, difficulty }, count);
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
	 * Build fallback question data when AI providers are unavailable
	 */
	private buildFallbackQuestionData(
		topic: string,
		difficulty: DifficultyLevel,
		index: number
	): ServerTriviaQuestionInput {
		const questionVariants = [
			`Which statement about ${topic} is accurate?`,
			`What best describes the trivia topic "${topic}"?`,
			`Select the fact that matches the theme of ${topic}.`,
			`Identify the correct insight regarding ${topic}.`,
		];
		const baseAnswers = [
			`${topic} is a core subject in the EveryTriv knowledge base.`,
			`Learning about ${topic} expands general knowledge and curiosity.`,
			`${topic} frequently appears in engaging trivia challenges.`,
			`Exploring ${topic} encourages players to think critically.`,
			`${topic} offers interesting facts that are easy to remember.`,
		];

		const questionText = questionVariants[index % questionVariants.length];
		const answers = [
			baseAnswers[(index + 0) % baseAnswers.length],
			baseAnswers[(index + 1) % baseAnswers.length],
			baseAnswers[(index + 2) % baseAnswers.length],
			baseAnswers[(index + 3) % baseAnswers.length],
		];

		return {
			question: questionText,
			answers,
			correctAnswerIndex: 0,
			topic,
			difficulty,
			metadata: {
				category: topic,
				source: 'system',
				providerName: 'fallback',
				difficulty,
				generatedAt: new Date().toISOString(),
			},
		};
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
		const source: TriviaQuestionSource =
			base.source && ALLOWED_TRIVIA_SOURCES.includes(base.source) ? base.source : 'ai';
		const reviewStatus: TriviaQuestionReviewStatus | undefined =
			base.reviewStatus && ALLOWED_REVIEW_STATUSES.includes(base.reviewStatus) ? base.reviewStatus : undefined;
		const fallbackExplanation = isNonEmptyString(explanation) ? explanation : undefined;

		return {
			category: isNonEmptyString(base.category) ? base.category : topic,
			tags: normalizeStringArray(base.tags),
			source,
			providerName: isNonEmptyString(base.providerName) ? base.providerName : undefined,
			difficulty: base.difficulty ?? difficulty,
			difficultyScore: typeof base.difficultyScore === 'number' ? base.difficultyScore : undefined,
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
			usageCount: typeof base.usageCount === 'number' ? base.usageCount : undefined,
			correctAnswerCount: typeof base.correctAnswerCount === 'number' ? base.correctAnswerCount : undefined,
			aiConfidenceScore: typeof base.aiConfidenceScore === 'number' ? base.aiConfidenceScore : undefined,
			safeContentScore: typeof base.safeContentScore === 'number' ? base.safeContentScore : undefined,
			flaggedReasons: normalizeStringArray(base.flaggedReasons),
			popularityScore: typeof base.popularityScore === 'number' ? base.popularityScore : undefined,
			averageAnswerTimeMs: typeof base.averageAnswerTimeMs === 'number' ? base.averageAnswerTimeMs : undefined,
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
	 * Save question to database
	 * @param triviaEntity Trivia entity
	 * @returns Saved trivia entity
	 */
	private async saveQuestion(triviaEntity: DeepPartial<TriviaEntity>): Promise<TriviaEntity> {
		try {
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
}
