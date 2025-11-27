/**
 * Base Trivia Provider
 *
 * @module BaseTriviaProvider
 * @description Abstract base class for all trivia question providers
 * @used_by server/src/features/game/logic/providers
 */
import {
	AI_PROVIDER_ERROR_TYPES,
	DIFFICULTY_MULTIPLIERS,
	DifficultyLevel,
	ERROR_CONTEXT_MESSAGES,
	FALLBACK_QUESTION_ANSWERS,
	HTTP_CLIENT_CONFIG,
	HTTP_ERROR_MESSAGES,
	HTTP_METHODS,
	HTTP_STATUS_CODES,
	PROVIDER_ERROR_MESSAGES,
} from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type {
	AIProviderInstance,
	AnalyticsMetadata,
	GameDifficulty,
	LLMResponse,
	LLMTriviaResponse,
	ProviderConfig,
	TriviaQuestion,
} from '@shared/types';
import {
	calculateRetryDelay,
	generateId,
	generateQuestionId,
	getErrorMessage,
	isProviderAuthError,
	isProviderRateLimitError,
	isRecord,
	shuffle,
} from '@shared/utils';
import { isCustomDifficulty, toDifficultyLevel } from '@shared/validation';

import { AI_PROVIDER_NAMES, PROVIDER_ERROR_MESSAGE_KEYS } from '@internal/constants';
import type { QuestionCacheMap, TriviaQuestionMetadata } from '@internal/types';
import { createAuthError, createServerError, createValidationError } from '@internal/utils';

import { PromptTemplates } from '../prompts';

/**
 * Abstract base class for trivia question providers
 * Provides common functionality for all AI providers
 */
export abstract class BaseTriviaProvider {
	protected abstract apiKey: string;
	public abstract name: string;

	// Helper method to extract metadata from trivia question
	protected extractMetadata(triviaQuestion: TriviaQuestion): TriviaQuestionMetadata {
		return {
			actualDifficulty: triviaQuestion.difficulty,
			totalQuestions: 1,
			customDifficultyMultiplier: 1,
			mappedDifficulty: triviaQuestion.difficulty,
		};
	}

	protected questionCache: QuestionCacheMap = {};
	protected analytics: Partial<AnalyticsMetadata> = {};

	// Provider instance for AIProviderWithTrivia interface
	abstract provider: AIProviderInstance;

	// Updated abstract method - answerCount is used for number of answer choices per question
	protected abstract getProviderConfig(prompt: string): ProviderConfig;

	// API call method with timeout, retry, and error handling
	protected async makeApiCall(prompt: string): Promise<LLMResponse> {
		if (!this.apiKey) {
			throw createAuthError(PROVIDER_ERROR_MESSAGES.API_KEY_NOT_CONFIGURED);
		}

		const config = this.getProviderConfig(prompt);
		let lastError: Error | null = null;
		let lastStatusCode: number | null = null;

		// Log initial request with detailed info (redact sensitive data)
		const sanitizedBody = config.body ? { ...config.body } : {};
		// Remove or redact sensitive fields from logging
		if ('messages' in sanitizedBody && Array.isArray(sanitizedBody.messages)) {
			// Keep message structure but limit content length for logging
			sanitizedBody.messages = sanitizedBody.messages.map((msg: { role?: string; content?: unknown }) => ({
				role: msg.role,
				content: typeof msg.content === 'string' ? `${msg.content.substring(0, 100)}...` : '[content]',
			}));
		}

		const modelValue =
			config.body && isRecord(config.body) && 'model' in config.body && typeof config.body.model === 'string'
				? config.body.model
				: undefined;

		logger.providerStats(this.name, {
			eventType: 'api_call_start',
			baseUrl: config.baseUrl.replace(config.apiKey || '', '[REDACTED]'),
			timeout: config.timeout,
			maxRetries: config.maxRetries,
			...(modelValue ? { model: modelValue } : {}),
		});

		// Retry logic
		for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
			try {
				// Create AbortController for timeout
				const abortController = new AbortController();
				const timeoutId = setTimeout(() => {
					abortController.abort();
				}, config.timeout);

				// Log request attempt
				if (attempt > 0) {
					logger.providerStats(this.name, {
						eventType: 'retry_attempt',
						attempt: attempt,
						maxRetries: config.maxRetries,
					});
				}

				// Make the API call
				const response = await globalThis.fetch(config.baseUrl, {
					method: HTTP_METHODS.POST,
					headers: config.headers ?? {},
					body: JSON.stringify(config.body),
					signal: abortController.signal,
				});

				clearTimeout(timeoutId);
				lastStatusCode = response.status;

				// Check if response is OK
				if (!response.ok) {
					const errorText = await response.text().catch(() => HTTP_ERROR_MESSAGES.UNKNOWN_ERROR);
					const errorMessage = `${this.name} API returned ${response.status} ${response.statusText}: ${errorText}`;

					// Log detailed error info for debugging (especially for 400 errors)
					if (response.status === HTTP_STATUS_CODES.BAD_REQUEST && this.name === AI_PROVIDER_NAMES.CLAUDE) {
						logger.providerError(this.name, 'Detailed 400 error for debugging', {
							status: response.status,
							error: errorText,
							attempt: attempt + 1,
						});
					}

					// Handle 401 Unauthorized - don't retry, throw immediately
					if (response.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
						logger.providerError(this.name, 'API key authentication failed', {
							status: response.status,
							error: errorText,
							attempt: attempt + 1,
						});
						const authError = new Error(errorMessage);
						Object.assign(authError, {
							statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
							isAuthError: true,
							provider: this.name,
						});
						throw authError;
					}

					// Handle 429 Rate Limit - smart retry with Retry-After header
					if (response.status === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
						const retryAfterHeader = response.headers.get('Retry-After');
						// Increased base delay for rate limits - start with 5 seconds minimum
						const baseDelay = Math.max(HTTP_CLIENT_CONFIG.RETRY_DELAY * 5, HTTP_CLIENT_CONFIG.RETRY_DELAY_RATE_LIMIT);

						let retryAfterSeconds: number | undefined;
						if (retryAfterHeader) {
							const parsed = parseInt(retryAfterHeader, 10);
							if (!isNaN(parsed) && parsed > 0) {
								retryAfterSeconds = parsed;
								logger.providerStats(this.name, {
									eventType: 'rate_limit_detected',
									attempt: attempt + 1,
									retryAfterSeconds,
								});
							}
						} else {
							// No Retry-After header, use exponential backoff with minimum 5 seconds
							logger.providerStats(this.name, {
								eventType: 'rate_limit_detected_no_header',
								attempt: attempt + 1,
							});
						}

						// If this is the last attempt, throw a special rate limit error
						if (attempt === config.maxRetries) {
							logger.providerError(this.name, 'Rate limit exceeded', {
								status: response.status,
								error: errorText,
								attempt: attempt + 1,
							});
							const rateLimitError = new Error(errorMessage);
							Object.assign(rateLimitError, {
								statusCode: HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
								isRateLimitError: true,
								retryAfter: retryAfterSeconds,
								provider: this.name,
							});
							throw rateLimitError;
						}

						// Calculate retry delay with exponential backoff and jitter
						const retryDelay = calculateRetryDelay(baseDelay, attempt, {
							retryAfter: retryAfterSeconds,
							minDelay: HTTP_CLIENT_CONFIG.RETRY_DELAY_RATE_LIMIT,
							jitter: { maxJitter: 2000 }, // up to 10% or 2 seconds
						});

						// Wait longer for rate limit errors
						logger.providerStats(this.name, {
							eventType: 'rate_limit_retry',
							attempt: attempt + 1,
							maxRetries: config.maxRetries,
							delay: retryDelay,
						});
						await new Promise(resolve => setTimeout(resolve, retryDelay));
						continue; // Retry after delay
					}

					// For other errors, throw and let retry logic handle it
					throw new Error(errorMessage);
				}

				// Parse response JSON
				const responseData = await response.json();

				// Convert to LLMResponse format
				const llmResponse: LLMResponse = {
					content: '',
					data: responseData,
					metadata: {
						provider: this.name,
						statusCode: response.status,
					},
				};

				logger.providerStats(this.name, {
					eventType: 'api_call_success',
					attempt: attempt + 1,
					statusCode: response.status,
				});

				return llmResponse;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Check if it's an auth error (401) - don't retry
				if (isProviderAuthError(lastError)) {
					throw lastError;
				}

				// Check if it's a rate limit error (429) on last attempt - don't retry again
				if (isProviderRateLimitError(lastError) && attempt === config.maxRetries) {
					throw lastError;
				}

				// Check if it's an abort error (timeout)
				if (lastError.name === 'AbortError' || lastError.message.includes('aborted')) {
					lastError = new Error(`${this.name} API call timed out after ${config.timeout}ms`);
				}

				// Handle fetch network errors with more context
				if (lastError.message === 'fetch failed' || lastError.message.includes('fetch failed')) {
					const networkError = new Error(
						`${this.name} API network error: Unable to connect to ${config.baseUrl}. This may be due to network issues, SSL/TLS problems, or the API being temporarily unavailable.`
					);
					Object.assign(networkError, {
						cause: lastError,
						isNetworkError: true,
					});
					lastError = networkError;
				}

				// Log error (only log as error on final attempt, otherwise as warning)
				if (attempt === config.maxRetries) {
					logger.providerError(this.name, ERROR_CONTEXT_MESSAGES.AI_GENERATION_FAILED, {
						error: getErrorMessage(lastError),
						statusCode: lastStatusCode ?? undefined,
						attempt: attempt + 1,
						maxRetries: config.maxRetries,
						timeout: config.timeout,
					});
				} else {
					logger.providerStats(this.name, {
						eventType: 'api_call_retry',
						error: getErrorMessage(lastError),
						statusCode: lastStatusCode ?? undefined,
						attempt: attempt + 1,
						maxRetries: config.maxRetries,
					});
				}

				// If this was the last attempt, throw the error
				if (attempt === config.maxRetries) {
					break;
				}

				// Wait before retrying (exponential backoff with jitter)
				const delay = calculateRetryDelay(HTTP_CLIENT_CONFIG.RETRY_DELAY, attempt, {
					jitter: { maxJitter: 1000 }, // עד 10% או 1 שנייה
				});
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}

		// If we get here, all retries failed
		const finalError = lastError || new Error(`${this.name} API call failed after ${config.maxRetries} retries`);
		if (lastStatusCode && finalError instanceof Error) {
			Object.assign(finalError, { statusCode: lastStatusCode });
		}
		throw finalError;
	}

	// Implement the required generateQuestion method from LLMProvider interface
	async generateQuestion(topic: string, difficulty: GameDifficulty): Promise<LLMTriviaResponse> {
		const question = await this.generateTriviaQuestionInternal(topic, difficulty, 5);
		return {
			questions: [
				{
					question: question.question,
					answers: question.answers.map(answer => answer.text),
					correctAnswerIndex: question.correctAnswerIndex,
				},
			],
			explanation: 'Generated by AI provider',
			content: 'Generated by AI provider',
			status: 'success' as const,
		};
	}

	// Implement the required generateTriviaQuestion method from LLMProvider interface
	async generateTriviaQuestion(
		topic: string,
		difficulty: GameDifficulty,
		excludeQuestions?: string[]
	): Promise<TriviaQuestion> {
		return this.generateTriviaQuestionInternal(topic, difficulty, 5, excludeQuestions);
	}

	// Implement the required hasApiKey method from LLMProvider interface
	hasApiKey(): boolean {
		return Boolean(this.apiKey && this.apiKey.length > 0);
	}

	async generateTriviaQuestionInternal(
		topic: string,
		difficulty: GameDifficulty,
		answerCount: number = 5,
		excludeQuestions?: string[]
	): Promise<TriviaQuestion> {
		const startTime = Date.now();

		try {
			// Clamp answer count to valid range (3-5) for batch generation
			const actualAnswerCount = Math.max(3, Math.min(5, answerCount));
			const prompt = this.buildPrompt(topic, difficulty, actualAnswerCount, excludeQuestions);

			// Determine if this is a custom difficulty

			// Add performance logging
			const promptBuildTime = Date.now() - startTime;
			logger.providerStats(this.name, {
				topic,
				difficulty,
				promptBuildTime,
				answerCount: actualAnswerCount,
			});

			const response = await this.makeApiCall(prompt);

			// Parse the LLM response with smart error handling
			let data: LLMTriviaResponse;
			try {
				data = this.parseResponse(response);
			} catch (err) {
				logger.providerError(this.name, ERROR_CONTEXT_MESSAGES.INVALID_RESPONSE, {
					error: getErrorMessage(err),
					topic,
					difficulty,
				});

				// Throw error instead of returning fallback question
				throw createServerError('parse AI provider response', err);
			}

			// Check if AI returned null response (could not generate question)
			if (!data.questions || data.questions.length === 0) {
				logger.providerError(this.name, 'AI could not generate question', {
					topic,
					difficulty,
					explanation: data.explanation || 'No explanation provided',
				});

				// Throw error instead of returning fallback question
				throw createServerError('AI could not generate question', new Error('AI returned empty response'));
			}

			// Calculate custom difficulty multiplier if needed

			// Create trivia question object
			const firstQuestion = data.questions[0];
			const question: TriviaQuestion = {
				id: generateQuestionId(),
				topic: topic,
				difficulty: difficulty,
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
					topic,
					difficulty,
					errors: ['Invalid question format'],
				});

				// Throw error instead of returning fallback question
				throw createServerError('validate question format', new Error('Invalid question format from AI provider'));
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
					topic,
					difficulty,
					errors: ['No correct answer found'],
				});
				throw createServerError('validate question format', new Error('No correct answer found after shuffle'));
			}
			question.correctAnswerIndex = correctAnswerIndex;

			logger.providerSuccess(this.name, {
				topic,
				difficulty,
			});

			// Check for duplicates and cache the question
			if (this.isDuplicate(question)) {
				logger.providerFallback(this.name, {
					topic,
					difficulty,
				});
				// In a real implementation, you might want to retry with a different prompt
			}

			// Add question to cache
			this.addQuestion(question);
			logger.providerSuccess(this.name, {
				topic,
				difficulty,
			});

			// Record analytics
			const responseTime = Date.now() - startTime;
			this.recordQuestion(question, responseTime);
			logger.providerStats(this.name, {
				topic,
				difficulty,
				responseTime,
			});

			return question;
		} catch (error) {
			this.recordError();
			logger.providerError(this.name, ERROR_CONTEXT_MESSAGES.AI_GENERATION_FAILED, {
				error: getErrorMessage(error),
				topic,
				difficulty,
			});

			// Re-throw the error instead of returning fallback question
			throw createServerError('generate trivia question', error);
		}
	}

	protected buildPrompt(
		topic: string,
		difficulty: GameDifficulty,
		answerCount: number,
		excludeQuestions?: string[]
	): string {
		// Use the advanced prompt generation with full quality guidelines
		return PromptTemplates.generateTriviaQuestion({
			topic,
			difficulty,
			answerCount,
			isCustomDifficulty: isCustomDifficulty(difficulty),
			excludeQuestions,
		});
	}

	/**
	 * Get provider-specific error message for invalid response format
	 * @returns Error message for the current provider
	 */
	protected getProviderErrorMessageKey(): string {
		const providerName = this.name;
		const isProviderName = (name: string): name is keyof typeof PROVIDER_ERROR_MESSAGE_KEYS => {
			return name in PROVIDER_ERROR_MESSAGE_KEYS;
		};

		if (isProviderName(providerName)) {
			const errorKey = PROVIDER_ERROR_MESSAGE_KEYS[providerName];
			if (errorKey) {
				// Map error key to actual error message
				const errorMessageMap: Record<string, string> = {
					INVALID_GROQ_RESPONSE: PROVIDER_ERROR_MESSAGES.INVALID_GROQ_RESPONSE,
					INVALID_GEMINI_RESPONSE: PROVIDER_ERROR_MESSAGES.INVALID_GEMINI_RESPONSE,
					INVALID_CHATGPT_RESPONSE: PROVIDER_ERROR_MESSAGES.INVALID_CHATGPT_RESPONSE,
					INVALID_CLAUDE_RESPONSE: PROVIDER_ERROR_MESSAGES.INVALID_CLAUDE_RESPONSE,
				};
				return errorMessageMap[errorKey] ?? PROVIDER_ERROR_MESSAGES.INVALID_QUESTION_FORMAT;
			}
		}
		return PROVIDER_ERROR_MESSAGES.INVALID_QUESTION_FORMAT;
	}

	/**
	 * Parse LLM content string to LLMTriviaResponse format
	 * This is a shared method used by all providers after extracting content from their specific response format
	 * @param content The JSON string content from LLM response
	 * @returns LLMTriviaResponse with parsed questions
	 */
	protected parseLLMContentToTriviaResponse(content: string): LLMTriviaResponse {
		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			throw createValidationError(`${this.name} ${PROVIDER_ERROR_MESSAGES.RESPONSE_CONTENT_EMPTY}`, 'string');
		}

		let parsed: { question?: string | null; answers?: string[]; explanation?: string };
		try {
			parsed = JSON.parse(content);
		} catch {
			throw createValidationError(`${this.name} response is not valid JSON`, 'string');
		}

		// Check if LLM returned error format (question is null)
		if (parsed.question === null || parsed.question === undefined) {
			return {
				questions: [],
				explanation: parsed.explanation || PROVIDER_ERROR_MESSAGES.UNABLE_TO_GENERATE_QUESTION,
				content: content,
				status: 'error',
			};
		}

		// Convert single question object to LLMTriviaResponse format
		// LLM returns: { question, answers, explanation }
		// We need: { questions: [{ question, answers, correctAnswerIndex }], explanation, content, status }
		if (parsed.question && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
			return {
				questions: [
					{
						question: parsed.question,
						answers: parsed.answers,
						correctAnswerIndex: 0, // Correct answer is first in the array
					},
				],
				explanation: parsed.explanation,
				content: content,
				status: 'success',
			};
		}

		// If format doesn't match expected structure, throw error
		throw createValidationError(`${this.name} ${PROVIDER_ERROR_MESSAGES.INVALID_QUESTION_FORMAT}`, 'string');
	}

	protected abstract parseResponse(response: LLMResponse): LLMTriviaResponse;

	protected getDifficultyMultiplier(difficulty: DifficultyLevel): number {
		switch (difficulty) {
			case DifficultyLevel.EASY:
				return DIFFICULTY_MULTIPLIERS[DifficultyLevel.EASY];
			case DifficultyLevel.MEDIUM:
				return DIFFICULTY_MULTIPLIERS[DifficultyLevel.MEDIUM];
			case DifficultyLevel.HARD:
				return DIFFICULTY_MULTIPLIERS[DifficultyLevel.HARD];
			default:
				return DIFFICULTY_MULTIPLIERS.CUSTOM_DEFAULT;
		}
	}

	// Helper methods for caching and analytics
	protected isDuplicate(question: TriviaQuestion): boolean {
		const key = `${question.question.toLowerCase().trim()}`;
		return this.questionCache[key] !== undefined;
	}

	protected addQuestion(question: TriviaQuestion): void {
		const key = `${question.question.toLowerCase().trim()}`;
		const now = new Date();
		this.questionCache[key] = {
			question: {
				question: question.question,
				answers: question.answers.map(a => a.text),
				correctAnswerIndex: question.correctAnswerIndex,
				difficulty: toDifficultyLevel(question.difficulty),
				topic: question.topic,
			},
			createdAt: question.createdAt,
			updatedAt: now,
			accessCount: 0,
			lastAccessed: now,
		};
	}

	protected recordQuestion(question: TriviaQuestion, responseTime: number): void {
		if (!this.analytics.questions) {
			this.analytics.questions = [];
		}
		this.analytics.questions.push({
			id: `analytics_${Date.now()}_${generateId(9)}`,
			topic: question.topic || 'unknown',
			difficulty: question.difficulty || 'unknown',
			responseTime,
			timestamp: new Date(),
		});
	}

	protected recordError(): void {
		if (!this.analytics.errors) {
			this.analytics.errors = [];
		}
		this.analytics.errors.push({
			timestamp: new Date(),
			provider: this.name,
		});
	}

	/**
	 * Create a fallback question when AI generation fails
	 */
	protected createFallbackQuestion(
		topic: string,
		difficulty: GameDifficulty,
		errorType: keyof typeof AI_PROVIDER_ERROR_TYPES
	): TriviaQuestion {
		return {
			id: generateQuestionId(),
			topic: topic,
			difficulty: difficulty,
			question: AI_PROVIDER_ERROR_TYPES[errorType],
			answers: FALLBACK_QUESTION_ANSWERS.map(answer => ({
				text: answer.text,
				isCorrect: answer.isCorrect,
			})),
			correctAnswerIndex: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
