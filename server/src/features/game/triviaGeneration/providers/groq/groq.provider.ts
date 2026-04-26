import { BadRequestException } from '@nestjs/common';

import {
	DEFAULT_LANGUAGE,
	DifficultyLevel,
	ERROR_MESSAGES,
	ErrorCode,
	HTTP_TIMEOUTS,
	OUTPUT_LANGUAGE_LABELS,
	SurpriseScope,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
	type Locale,
} from '@shared/constants';
import type { GameDifficulty, SurprisePickResult, TriviaQuestion, TriviaQuestionDetailsMetadata } from '@shared/types';
import { calculateDuration, clamp, getErrorMessage, isRecord, sanitizeInput, shuffle } from '@shared/utils';
import {
	createCustomDifficulty,
	extractCustomDifficultyText,
	isCustomDifficulty,
	isRegisteredDifficulty,
	toDifficultyLevel,
	VALIDATORS,
} from '@shared/validation';

import {
	GROQ_DEFAULT_MODEL_CONFIG,
	GROQ_DEFAULT_REQUESTS_PER_MINUTE,
	GROQ_DEFAULT_TOKENS_PER_MINUTE,
	GROQ_FREE_TIER_MODELS,
	GROQ_PROVIDER_MAX_TOKENS,
	GROQ_PROVIDER_NAME,
	GROQ_PROVIDER_VERSION,
	GROQ_TOPIC_DIFFICULTY_GATE_MAX_TOKENS,
	parseTriviaGenerationDeclinedReason,
	TRIVIA_GENERATION_DECLINED_REASON,
	type TriviaGenerationDeclinedReason,
} from '@internal/constants';
import { serverLogger as logger } from '@internal/services';
import type {
	AIProviderInstance,
	LLMTriviaResponse,
	PromptParams,
	ProviderTriviaGenerationResult,
} from '@internal/types';
import { createServerError } from '@internal/utils';

import {
	buildSurprisePickPrompt,
	buildTopicDifficultyGateUserPrompt,
	buildTriviaPrompt,
	SURPRISE_PICK_SYSTEM_PROMPT,
	TOPIC_DIFFICULTY_GATE_SYSTEM_PROMPT,
} from '../prompts';
import { GroqApiClient } from './groq.apiClient';
import { GroqResponseParser } from './groq.responseParser';

export class GroqTriviaProvider {
	public readonly name = GROQ_PROVIDER_NAME;
	protected apiKey: string;

	private apiClient: GroqApiClient;
	private responseParser: GroqResponseParser;

	// Provider instance for AIProviderWithTrivia interface
	provider: AIProviderInstance = {
		name: GROQ_PROVIDER_NAME,
		config: {
			model: GROQ_FREE_TIER_MODELS[0],
			version: GROQ_PROVIDER_VERSION,
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: GROQ_DEFAULT_REQUESTS_PER_MINUTE,
				tokensPerMinute: GROQ_DEFAULT_TOKENS_PER_MINUTE,
			},
			costPerToken: GROQ_DEFAULT_MODEL_CONFIG?.cost ?? 0,
			maxTokens: GROQ_PROVIDER_MAX_TOKENS,
			lastUpdated: new Date(),
		},
		isAvailable: true,
		lastCheck: new Date(),
		errorCount: 0,
		successCount: 0,
		averageResponseTime: 0,
		currentLoad: 0,
	};

	private static stripControlCharacters(value: string): string {
		return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
	}

	constructor() {
		this.apiKey = process.env.GROQ_API_KEY ?? '';
		this.apiClient = new GroqApiClient(this.apiKey, this.name);
		this.responseParser = new GroqResponseParser(this.name);
	}

	async evaluateTopicDifficultyGate(params: {
		topic: string;
		difficulty: GameDifficulty;
		outputLanguage: Locale;
		outputLanguageLabel: string;
	}): Promise<TriviaGenerationDeclinedReason | null> {
		const startTime = Date.now();
		try {
			const sanitizedTopic = GroqTriviaProvider.stripControlCharacters(
				sanitizeInput(params.topic, VALIDATION_LENGTH.TOPIC.MAX)
			);

			let sanitizedDifficulty: GameDifficulty = params.difficulty;
			if (isCustomDifficulty(params.difficulty)) {
				sanitizedDifficulty = createCustomDifficulty(
					GroqTriviaProvider.stripControlCharacters(
						sanitizeInput(extractCustomDifficultyText(params.difficulty), VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX)
					)
				);
			} else {
				const normalizedRegistered = GroqTriviaProvider.stripControlCharacters(
					sanitizeInput(params.difficulty, 32)
				).toLowerCase();
				sanitizedDifficulty = isRegisteredDifficulty(normalizedRegistered)
					? normalizedRegistered
					: toDifficultyLevel(params.difficulty);
			}

			const userPrompt = buildTopicDifficultyGateUserPrompt({
				topic: sanitizedTopic,
				difficulty: sanitizedDifficulty,
				outputLanguageLabel: params.outputLanguageLabel,
				outputLanguage: params.outputLanguage,
			});

			const response = await this.apiClient.makeApiCall(userPrompt, TOPIC_DIFFICULTY_GATE_SYSTEM_PROMPT, {
				maxTokens: GROQ_TOPIC_DIFFICULTY_GATE_MAX_TOKENS,
				timeoutMs: HTTP_TIMEOUTS.TOPIC_DIFFICULTY_GATE,
			});

			const rawContent = response.data?.choices?.[0]?.message?.content;
			const content = VALIDATORS.string(rawContent)
				? rawContent
				: typeof rawContent === 'object' && rawContent != null
					? JSON.stringify(rawContent)
					: '';
			if (!content || content.trim().length === 0) {
				return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY;
			}

			let jsonString: string;
			try {
				jsonString = this.extractSurprisePickJson(content.trim());
			} catch {
				return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY;
			}

			let parsed: Record<string, unknown>;
			try {
				const parsedResult = JSON.parse(jsonString);
				parsed = isRecord(parsedResult) ? parsedResult : {};
			} catch {
				return TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY;
			}

			if (parsed.ok === true) {
				logger.providerStats(this.name, {
					eventType: 'topic_difficulty_gate_accepted',
					responseTime: calculateDuration(startTime),
				});
				return null;
			}

			const reason = parseTriviaGenerationDeclinedReason(parsed.reason);
			logger.providerStats(this.name, {
				eventType: 'topic_difficulty_gate_rejected',
				reason,
				responseTime: calculateDuration(startTime),
			});
			return reason;
		} catch (error) {
			logger.providerError(this.name, 'Topic difficulty gate failed', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('topic difficulty gate', error);
		}
	}

	async generateTriviaQuestion(params: PromptParams, signal?: AbortSignal): Promise<ProviderTriviaGenerationResult> {
		const startTime = Date.now();

		try {
			// Get answer count with default value and clamp to valid range (3-5)
			const answerCount = params.answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
			const actualAnswerCount = clamp(
				answerCount,
				VALIDATION_COUNT.ANSWER_COUNT.MIN,
				VALIDATION_COUNT.ANSWER_COUNT.MAX
			);

			// Log the answer count for debugging
			if (params.answerCount !== undefined && params.answerCount !== actualAnswerCount) {
				logger.providerStats(this.name, {
					topic: params.topic,
					difficulty: params.difficulty,
					requestedAnswerCount: params.answerCount,
					clampedAnswerCount: actualAnswerCount,
					message: 'Answer count was clamped to valid range',
				});
			}

			const sanitizedTopic = GroqTriviaProvider.stripControlCharacters(
				sanitizeInput(params.topic, VALIDATION_LENGTH.TOPIC.MAX)
			);

			let sanitizedDifficulty: GameDifficulty = params.difficulty;
			if (isCustomDifficulty(params.difficulty)) {
				sanitizedDifficulty = createCustomDifficulty(
					GroqTriviaProvider.stripControlCharacters(
						sanitizeInput(extractCustomDifficultyText(params.difficulty), VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX)
					)
				);
			} else {
				const normalizedRegistered = GroqTriviaProvider.stripControlCharacters(
					sanitizeInput(params.difficulty, 32)
				).toLowerCase();
				sanitizedDifficulty = isRegisteredDifficulty(normalizedRegistered)
					? normalizedRegistered
					: toDifficultyLevel(params.difficulty);
			}

			const mappedExcludes = params.excludeQuestions
				?.map(q => GroqTriviaProvider.stripControlCharacters(sanitizeInput(q, VALIDATION_LENGTH.QUESTION.MAX)))
				.filter(q => q.length > 0);

			const sanitizedParams: PromptParams = {
				...params,
				answerCount: actualAnswerCount,
				topic: sanitizedTopic,
				difficulty: sanitizedDifficulty,
				...(mappedExcludes && mappedExcludes.length > 0
					? { excludeQuestions: mappedExcludes }
					: { excludeQuestions: undefined }),
			};

			const prompt = buildTriviaPrompt({
				...sanitizedParams,
				answerCount: actualAnswerCount,
				isCustomDifficulty: isCustomDifficulty(sanitizedParams.difficulty),
			});

			const response = await this.apiClient.makeApiCall(prompt, undefined, { signal });

			// Parse the LLM response with smart error handling
			let data: LLMTriviaResponse;
			try {
				data = this.responseParser.parseResponse(response, actualAnswerCount);
			} catch (err) {
				logger.providerError(this.name, ERROR_MESSAGES.provider.INVALID_PROVIDER_RESPONSE, {
					errorInfo: { message: getErrorMessage(err) },
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
					explanation: data.explanation ?? 'No explanation provided',
					generationDeclinedReason:
						data.declinedReason ?? TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS,
				});

				this.throwTriviaGenerationDeclined(
					data.declinedReason ?? TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS
				);
			}

			// Create trivia question object
			const firstQuestion = questions[0];
			if (!firstQuestion) {
				this.throwTriviaGenerationDeclined(
					data.declinedReason ?? TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS
				);
			}
			// Create base question object (without correctAnswerIndex initially)
			const questionBase = {
				topic: params.topic,
				difficulty: params.difficulty,
				question: firstQuestion.question,
				answers: firstQuestion.answers,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Validate the question quality
			if (!questionBase.question || !questionBase.answers || questionBase.answers.length < 2) {
				logger.providerError(this.name, 'Question validation failed: Invalid question format', {
					topic: params.topic,
					difficulty: params.difficulty,
					errorInfo: { messages: ['Invalid question format'] },
				});

				// Throw error instead of returning fallback question
				throw createServerError('validate question format', new Error(ErrorCode.INVALID_QUESTION_FORMAT_FROM_AI));
			}

			// Sanitize the question
			questionBase.question = questionBase.question.trim();
			questionBase.answers = questionBase.answers.map(answer => ({
				...answer,
				text: answer.text.trim(),
			}));

			// Shuffle answers to prevent position bias
			questionBase.answers = shuffle(questionBase.answers);

			// Validate that there is exactly one correct answer after shuffling
			const correctAnswerCount = questionBase.answers.filter(answer => answer.isCorrect).length;
			if (correctAnswerCount !== 1) {
				logger.providerError(this.name, 'Question validation failed: Invalid correct answer count after shuffle', {
					topic: params.topic,
					difficulty: params.difficulty,
					errorInfo: { messages: [`Expected 1 correct answer, found ${correctAnswerCount}`] },
				});
				throw createServerError('validate question format', new Error(ErrorCode.NO_CORRECT_ANSWER_FOUND));
			}

			// Calculate correctAnswerIndex after shuffling and create final question object
			const correctAnswerIndex = questionBase.answers.findIndex(answer => answer.isCorrect);
			const question: Omit<TriviaQuestion, 'id'> = {
				...questionBase,
				correctAnswerIndex,
			};

			const resolvedMappedDifficulty = toDifficultyLevel(params.difficulty);
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
				errorInfo: { message: getErrorMessage(error) },
				topic: params.topic,
				difficulty: params.difficulty,
			});

			// Re-throw the error instead of returning fallback question
			throw createServerError('generate trivia question', error);
		}
	}

	async pickSurpriseTopicAndDifficulty(options: {
		excludeTopics: string[];
		scope: SurpriseScope;
		locale?: Locale;
	}): Promise<SurprisePickResult> {
		const { excludeTopics, scope, locale } = options;
		const outputLanguage = OUTPUT_LANGUAGE_LABELS[locale ?? DEFAULT_LANGUAGE];
		try {
			const userPrompt = buildSurprisePickPrompt({
				excludeTopics,
				scope,
				outputLanguageLabel: outputLanguage,
				locale: locale ?? DEFAULT_LANGUAGE,
			});
			const response = await this.apiClient.makeApiCall(userPrompt, SURPRISE_PICK_SYSTEM_PROMPT);

			const rawContent = response.data?.choices?.[0]?.message?.content;
			const content = VALIDATORS.string(rawContent)
				? rawContent
				: typeof rawContent === 'object' && rawContent != null
					? JSON.stringify(rawContent)
					: '';
			if (!content || content.trim().length === 0) {
				throw createServerError('surprise pick', new Error(ERROR_MESSAGES.provider.INVALID_GROQ_RESPONSE));
			}

			const jsonString = this.extractSurprisePickJson(content.trim());
			let parsed: Record<string, unknown>;
			try {
				const result = JSON.parse(jsonString);
				parsed = isRecord(result) ? result : {};
			} catch {
				throw createServerError('surprise pick', new Error(ErrorCode.INVALID_QUESTION_FORMAT_FROM_AI));
			}

			const result: SurprisePickResult = {};

			if (scope === SurpriseScope.TOPIC || scope === SurpriseScope.BOTH) {
				const topic = VALIDATORS.string(parsed.topic) ? parsed.topic.trim() : '';
				if (topic.length < VALIDATION_LENGTH.TOPIC.MIN || topic.length > VALIDATION_LENGTH.TOPIC.MAX) {
					throw createServerError(
						'surprise pick',
						new Error(`Topic length must be between ${VALIDATION_LENGTH.TOPIC.MIN} and ${VALIDATION_LENGTH.TOPIC.MAX}`)
					);
				}
				result.topic = topic;
			}

			if (scope === SurpriseScope.DIFFICULTY || scope === SurpriseScope.BOTH) {
				const difficultyRaw = VALIDATORS.string(parsed.difficulty) ? parsed.difficulty.trim() : '';
				if (difficultyRaw.length === 0) {
					throw createServerError('surprise pick', new Error('Difficulty is required'));
				}
				const difficultyLower = difficultyRaw.toLowerCase();
				result.difficulty = isRegisteredDifficulty(difficultyLower)
					? difficultyLower
					: createCustomDifficulty(
							difficultyRaw.length > VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX
								? difficultyRaw.slice(0, VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX)
								: difficultyRaw
						);
			}

			return result;
		} catch (error) {
			logger.providerError(this.name, 'Surprise pick failed', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('surprise pick', error);
		}
	}

	private extractSurprisePickJson(content: string): string {
		try {
			JSON.parse(content);
			return content;
		} catch {
			// ignore
		}
		const markdownBlock = /```(?:json)?\s*([\s\S]*?)```/i;
		const match = content.match(markdownBlock);
		if (match?.[1]) {
			const candidate = match[1].trim();
			try {
				JSON.parse(candidate);
				return candidate;
			} catch {
				// ignore
			}
		}
		const objectMatch = content.match(/\{[\s\S]*\}/);
		if (objectMatch?.[0]) {
			return objectMatch[0];
		}
		throw createServerError('surprise pick', new Error(ErrorCode.INVALID_QUESTION_FORMAT_FROM_AI));
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

	private throwTriviaGenerationDeclined(reason: TriviaGenerationDeclinedReason): never {
		let message: string;
		switch (reason) {
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_DIFFICULTY:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_DIFFICULTY;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.UNCLEAR_TOPIC_AND_DIFFICULTY:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_UNCLEAR_TOPIC_AND_DIFFICULTY;
				break;
			case TRIVIA_GENERATION_DECLINED_REASON.INSUFFICIENT_VERIFIABLE_FACTS:
				message = ERROR_MESSAGES.game.TRIVIA_DECLINED_INSUFFICIENT_VERIFIABLE_FACTS;
				break;
		}
		throw new BadRequestException({
			message,
			errors: [message],
		});
	}
}
