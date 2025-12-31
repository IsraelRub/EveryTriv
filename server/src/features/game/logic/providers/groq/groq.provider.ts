/**
 * Groq Trivia Provider
 * Supports various Groq models (Llama, GPT-OSS, Mixtral, Gemma) through a single API
 */
import {
	DifficultyLevel,
	ERROR_CODES,
	ERROR_MESSAGES,
	GROQ_DEFAULT_MODEL,
	GROQ_DEFAULT_MODEL_CONFIG,
	GROQ_DEFAULT_REQUESTS_PER_MINUTE,
	GROQ_DEFAULT_TOKENS_PER_MINUTE,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { TriviaQuestion, TriviaQuestionDetailsMetadata } from '@shared/types';
import { calculateDuration, generateQuestionId, getErrorMessage, shuffle } from '@shared/utils';
import { extractCustomDifficultyText, isCustomDifficulty } from '@shared/validation';
import { serverLogger as logger } from '@internal/services';
import type {
	AIProviderInstance,
	LLMTriviaResponse,
	PromptParams,
	ProviderTriviaGenerationResult,
} from '@internal/types';
import { createServerError } from '@internal/utils';
import { generateTriviaQuestion } from '../prompts';
import { GroqApiClient } from './groq.apiClient';
import { GroqResponseParser } from './groq.responseParser';

/**
 * Groq Trivia Provider
 * Supports multiple Groq models with priority-based selection
 */
export class GroqTriviaProvider {
	public readonly name = 'Groq';
	protected apiKey: string;

	private apiClient: GroqApiClient;
	private responseParser: GroqResponseParser;

	// Provider instance for AIProviderWithTrivia interface
	provider: AIProviderInstance = {
		name: 'Groq',
		config: {
			providerName: 'Groq',
			model: GROQ_DEFAULT_MODEL,
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: GROQ_DEFAULT_REQUESTS_PER_MINUTE,
				tokensPerMinute: GROQ_DEFAULT_TOKENS_PER_MINUTE,
			},
			costPerToken: GROQ_DEFAULT_MODEL_CONFIG?.cost ?? 0,
			maxTokens: 8192,
			lastUpdated: new Date(),
		},
		isAvailable: true,
		lastCheck: new Date(),
		errorCount: 0,
		successCount: 0,
		averageResponseTime: 0,
		currentLoad: 0,
	};

	constructor() {
		this.apiKey = process.env.GROQ_API_KEY || '';
		this.apiClient = new GroqApiClient(this.apiKey, this.name);
		this.responseParser = new GroqResponseParser(this.name);
	}

	async generateTriviaQuestion(params: PromptParams): Promise<ProviderTriviaGenerationResult> {
		const startTime = Date.now();

		try {
			// Get answer count with default value and clamp to valid range (3-5)
			const answerCount = params.answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
			const actualAnswerCount = Math.max(
				VALIDATION_COUNT.ANSWER_COUNT.MIN,
				Math.min(VALIDATION_COUNT.ANSWER_COUNT.MAX, answerCount)
			);
			const prompt = generateTriviaQuestion({
				...params,
				answerCount: actualAnswerCount,
				isCustomDifficulty: isCustomDifficulty(params.difficulty),
			});

			const response = await this.apiClient.makeApiCall(prompt);

			// Parse the LLM response with smart error handling
			let data: LLMTriviaResponse;
			try {
				data = this.responseParser.parseResponse(response, actualAnswerCount);
			} catch (err) {
				logger.providerError(this.name, ERROR_MESSAGES.provider.INVALID_RESPONSE, {
					error: getErrorMessage(err),
					topic: params.topic,
					difficulty: params.difficulty,
				});

				// Throw error instead of returning fallback question
				throw createServerError('parse AI provider response', err);
			}

			if (data.validationSummary) {
				logger.providerStats(this.name, {
					topic: params.topic,
					difficulty: params.difficulty,
					validation: data.validationSummary,
				});
			}

			const { questions } = data;

			// Check if AI returned null response (could not generate question)
			if (!questions || questions.length === 0) {
				logger.providerError(this.name, 'AI could not generate question', {
					topic: params.topic,
					difficulty: params.difficulty,
					explanation: data.explanation || 'No explanation provided',
				});

				// Throw error instead of returning fallback question
				throw createServerError('AI could not generate question', new Error(ERROR_CODES.AI_RETURNED_EMPTY_RESPONSE));
			}

			// Create trivia question object
			const firstQuestion = questions[0];
			if (!firstQuestion) {
				throw createServerError('AI could not generate question', new Error(ERROR_CODES.AI_RETURNED_EMPTY_RESPONSE));
			}
			const question: TriviaQuestion = {
				id: generateQuestionId(),
				topic: params.topic,
				difficulty: params.difficulty,
				question: firstQuestion.question,
				answers: firstQuestion.answers.map((answerText: string, i: number) => ({
					text: answerText,
					isCorrect: i === firstQuestion.correctAnswerIndex,
				})),
				correctAnswerIndex: firstQuestion.correctAnswerIndex,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Validate the question quality
			if (!question.question || !question.answers || question.answers.length < 2) {
				logger.providerError(this.name, 'Question validation failed: Invalid question format', {
					topic: params.topic,
					difficulty: params.difficulty,
					errors: ['Invalid question format'],
				});

				// Throw error instead of returning fallback question
				throw createServerError('validate question format', new Error(ERROR_CODES.INVALID_QUESTION_FORMAT_FROM_AI));
			}

			// Sanitize the question
			question.question = question.question.trim();
			question.answers = question.answers.map(answer => ({
				...answer,
				text: answer.text.trim(),
			}));

			// Shuffle answers to prevent position bias
			question.answers = shuffle(question.answers);

			// Update correctAnswerIndex after shuffling
			const correctAnswerIndex = question.answers.findIndex(answer => answer.isCorrect);
			if (correctAnswerIndex === -1) {
				logger.providerError(this.name, 'Question validation failed: No correct answer found after shuffle', {
					topic: params.topic,
					difficulty: params.difficulty,
					errors: ['No correct answer found'],
				});
				throw createServerError('validate question format', new Error(ERROR_CODES.NO_CORRECT_ANSWER_FOUND));
			}
			question.correctAnswerIndex = correctAnswerIndex;

			const resolvedMappedDifficulty = this.resolveMappedDifficulty(params.difficulty);
			question.metadata = this.applyMetadata(question.metadata, resolvedMappedDifficulty, params.difficulty);

			const responseTime = calculateDuration(startTime);
			logger.providerSuccess(this.name, {
				topic: params.topic,
				difficulty: params.difficulty,
				responseTime,
			});
			return {
				question,
				mappedDifficulty: resolvedMappedDifficulty,
			};
		} catch (error) {
			logger.providerError(this.name, ERROR_MESSAGES.provider.AI_GENERATION_FAILED, {
				error: getErrorMessage(error),
				topic: params.topic,
				difficulty: params.difficulty,
			});

			// Re-throw the error instead of returning fallback question
			throw createServerError('generate trivia question', error);
		}
	}

	private resolveMappedDifficulty(requestedDifficulty: string): DifficultyLevel {
		const normalized = requestedDifficulty.trim().toLowerCase();
		if (normalized === DifficultyLevel.EASY) {
			return DifficultyLevel.EASY;
		}

		if (normalized === DifficultyLevel.MEDIUM) {
			return DifficultyLevel.MEDIUM;
		}

		if (normalized === DifficultyLevel.HARD) {
			return DifficultyLevel.HARD;
		}

		return DifficultyLevel.MEDIUM;
	}

	private applyMetadata(
		existing: TriviaQuestionDetailsMetadata | undefined,
		mappedDifficulty: DifficultyLevel,
		requestedDifficulty: string
	): TriviaQuestionDetailsMetadata {
		const base: TriviaQuestionDetailsMetadata = {
			...(existing ?? {}),
			providerName: this.name,
			mappedDifficulty,
		};

		if (isCustomDifficulty(requestedDifficulty)) {
			const customText = extractCustomDifficultyText(requestedDifficulty).trim();
			base.customDifficultyDescription = customText.length > 0 ? customText : requestedDifficulty;
		}

		return base;
	}
}
