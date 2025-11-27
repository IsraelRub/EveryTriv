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
import type { ServerTriviaQuestionInput } from '@internal/types';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import { AiProvidersService } from './providers/management';

const ALLOWED_TRIVIA_SOURCES: TriviaQuestionSource[] = ['ai', 'user', 'imported', 'seeded', 'system'];
const ALLOWED_REVIEW_STATUSES: TriviaQuestionReviewStatus[] = ['pending', 'approved', 'rejected', 'flagged'];

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isTriviaQuestionSource = (value: unknown): value is TriviaQuestionSource => {
	if (typeof value !== 'string') {
		return false;
	}
	for (const allowedSource of ALLOWED_TRIVIA_SOURCES) {
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
	for (const allowedStatus of ALLOWED_REVIEW_STATUSES) {
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
	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly aiProvidersService: AiProvidersService
	) {}

	/**
	 * Generate trivia question using AI
	 *
	 * Process:
	 * 1. Generates question using AI providers with excludeQuestions to prevent duplicates
	 * 2. Before saving, checks if question already exists in database
	 * 3. If question exists, returns existing question instead of creating duplicate
	 * 4. If question doesn't exist, saves new question to database
	 *
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param userId User ID for personalization
	 * @param excludeQuestions List of question texts to exclude (to prevent duplicates in AI generation)
	 * @returns Generated or existing trivia question entity
	 */
	async generateQuestion(
		topic: string,
		difficulty: GameDifficulty,
		userId?: string,
		excludeQuestions?: string[]
	): Promise<TriviaEntity> {
		try {
			logger.gameTarget('Generating trivia question', {
				topic,
				difficulty,
				userId: userId || 'anonymous',
			});

			// Try to generate question using AI
			const aiQuestion = await this.aiProvidersService.generateQuestion(topic, difficulty, excludeQuestions);
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
		excludeQuestionTexts: string[] = []
	): Promise<TriviaEntity[]> {
		try {
			logger.gameTarget('Getting available questions', {
				topic,
				difficulty,
				count,
				totalItems: excludeQuestionTexts.length,
			});

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
		const source: TriviaQuestionSource = isTriviaQuestionSource(base.source) ? base.source : 'ai';
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
}
