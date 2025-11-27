/**
 * AI Providers Service
 *
 * @module AiProvidersService
 * @description Service for managing multiple AI providers with load balancing and fallback
 * @used_by server/src/features/game/logic
 */
import { Injectable } from '@nestjs/common';

import { HTTP_STATUS_CODES, PROVIDER_ERROR_MESSAGES } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { GameDifficulty, ProviderStats, TriviaQuestion } from '@shared/types';
import {
	ensureErrorObject,
	getErrorMessage,
	isProviderAuthError,
	isProviderErrorWithStatusCode,
	isProviderRateLimitError,
} from '@shared/utils';

import { AI_PROVIDER_PRIORITIES } from '@internal/constants';
import { createServerError } from '@internal/utils';

import {
	ChatGPTTriviaProvider,
	ClaudeTriviaProvider,
	GeminiTriviaProvider,
	GroqTriviaProvider,
} from '../implementations';

/**
 * Service for managing multiple AI providers with load balancing and fallback
 * @class AiProvidersService
 * @description Implements round-robin selection and automatic failover between AI providers.
 * Providers are ordered by priority (lower number = higher priority) based on cost:
 * 1. Groq (priority: AI_PROVIDER_PRIORITIES.GROQ) - Free tier with Llama 3.1 8B
 * 2. Gemini (priority: AI_PROVIDER_PRIORITIES.GEMINI) - $0.075/M tokens with Gemini 1.5 Flash
 * 3. ChatGPT (priority: AI_PROVIDER_PRIORITIES.CHATGPT) - $0.15/M tokens with GPT-4o-mini
 * 4. Claude (priority: AI_PROVIDER_PRIORITIES.CLAUDE) - $0.25/M tokens with Claude 3.5 Haiku
 * @used_by server/features/game/logic/trivia-generation.service.ts (trivia question generation)
 */
@Injectable()
export class AiProvidersService {
	private llmProviders: (ClaudeTriviaProvider | GeminiTriviaProvider | ChatGPTTriviaProvider | GroqTriviaProvider)[] =
		[];
	private currentProviderIndex = 0;
	private providerStats: Map<string, ProviderStats> = new Map();

	// Track providers that have permanently failed (auth/rate limit errors)
	// These are shared across all question generation calls
	private permanentlyFailedProviders: Set<string> = new Set();

	// Track the last successful provider to use it first in subsequent calls
	private lastSuccessfulProvider: string | null = null;

	// Track temporary failures (non-auth/rate-limit) that should be reset after some time
	private temporaryFailedProviders: Map<string, number> = new Map();
	private readonly TEMP_FAILURE_RESET_TIME = 60000; // Reset after 1 minute

	// Track in-flight requests to share successful provider info across parallel calls
	private inFlightRequests: Set<Promise<TriviaQuestion>> = new Set();

	constructor() {
		this.initializeProviders();
	}

	/**
	 * Initialize available AI providers based on environment variables.
	 * Providers are initialized in priority order (lowest cost first):
	 * 1. Groq (free) - requires GROQ_API_KEY
	 * 2. Gemini ($0.075/M) - requires GEMINI_API_KEY
	 * 3. ChatGPT ($0.15/M) - requires CHATGBT_API_KEY
	 * 4. Claude ($0.25/M) - requires CLAUDE_API_KEY
	 * @private
	 */
	private initializeProviders(): void {
		const providers = [
			new GroqTriviaProvider(),
			new GeminiTriviaProvider(),
			new ChatGPTTriviaProvider(),
			new ClaudeTriviaProvider(),
		];

		this.llmProviders = providers.filter(provider => {
			const hasApiKey =
				'hasApiKey' in provider && typeof provider.hasApiKey === 'function' ? provider.hasApiKey() : false;
			if (!hasApiKey) {
				logger.providerConfig(provider.name, {
					context: 'AiProvidersService',
					status: 'missing_api_key',
					message: `API key not configured for ${provider.name} - provider will be skipped`,
				});
			} else {
				const providerName = provider.name;
				const isProviderName = (name: string): name is keyof typeof AI_PROVIDER_PRIORITIES => {
					return name in AI_PROVIDER_PRIORITIES;
				};
				const priority = isProviderName(providerName) ? AI_PROVIDER_PRIORITIES[providerName] : 0;

				logger.providerSuccess(provider.name, {
					context: 'AiProvidersService',
					message: `${provider.name} provider initialized successfully`,
					model: provider.provider.config.model,
					priority,
					costPerToken: provider.provider.config.costPerToken,
				});
			}
			return hasApiKey;
		});

		if (this.llmProviders.length === 0) {
			logger.providerError('all', 'No AI providers configured', {
				context: 'AiProvidersService',
				message: 'No AI providers have valid API keys - trivia generation will fail',
			});
		} else {
			logger.providerStats('initialization_complete', {
				context: 'AiProvidersService',
				totalProviders: this.llmProviders.length,
				providers: this.llmProviders.map(p => p.name),
			});
		}

		this.llmProviders.forEach(provider => {
			this.providerStats.set(provider.name, {
				providerName: provider.name,
				requests: 0,
				successes: 0,
				failures: 0,
				averageResponseTime: 0,
				lastUsed: null,
				status: 'available',
				successRate: 0,
				errorRate: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		});
	}

	/**
	 * Generate a new trivia question using AI providers with retry logic and performance optimization
	 * @param topic The topic for the trivia question
	 * @param difficulty The difficulty level
	 * @param excludeQuestions List of question texts to exclude (to prevent duplicates)
	 * @returns Promise<TriviaQuestion> The generated question
	 */
	async generateQuestion(
		topic: string,
		difficulty: GameDifficulty,
		excludeQuestions?: string[]
	): Promise<TriviaQuestion> {
		if (this.llmProviders.length === 0) {
			logger.providerError('all', PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE, {
				context: 'AiProvidersService',
				topic,
				difficulty,
			});
			throw createServerError('generate question', new Error(PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE));
		}

		// Clean up temporary failures that have expired
		this.cleanupTemporaryFailures();

		// Wait a short time to see if another parallel request finds a successful provider
		// This allows parallel requests to benefit from each other's discoveries
		if (this.inFlightRequests.size > 0 && !this.lastSuccessfulProvider) {
			// Wait up to 100ms to see if another request finds a working provider
			// Check periodically if lastSuccessfulProvider was updated
			const checkInterval = 20; // Check every 20ms
			const maxWaitTime = 100;
			const startWait = Date.now();

			while (Date.now() - startWait < maxWaitTime && !this.lastSuccessfulProvider) {
				await new Promise(resolve => setTimeout(resolve, checkInterval));
				// If lastSuccessfulProvider was updated by another request, break immediately
				if (this.lastSuccessfulProvider) {
					break;
				}
			}
		}

		const startTime = Date.now();
		const maxAttempts = this.llmProviders.length;
		const failedProviders = new Set<string>(this.permanentlyFailedProviders);
		const attemptedProviders = new Set<string>();

		// Add temporary failures to the failed set
		this.temporaryFailedProviders.forEach((timestamp, providerName) => {
			if (Date.now() - timestamp < this.TEMP_FAILURE_RESET_TIME) {
				failedProviders.add(providerName);
			}
		});

		// Create the promise for this request
		let questionPromise: Promise<TriviaQuestion>;

		try {
			// Wrap the generation logic in a promise that we can track
			questionPromise = this.generateQuestionInternal(
				topic,
				difficulty,
				startTime,
				maxAttempts,
				failedProviders,
				attemptedProviders,
				excludeQuestions
			);

			// Track this request
			this.inFlightRequests.add(questionPromise);

			// Clean up when done
			questionPromise.finally(() => {
				this.inFlightRequests.delete(questionPromise);
			});

			return await questionPromise;
		} catch (error) {
			logger.providerError('all', getErrorMessage(error), {
				context: 'AiProvidersService',
				topic,
				difficulty,
				totalProviders: this.llmProviders.length,
			});
			throw error;
		}
	}

	/**
	 * Internal method to generate a question (extracted for tracking parallel requests)
	 * @private
	 */
	private async generateQuestionInternal(
		topic: string,
		difficulty: GameDifficulty,
		startTime: number,
		maxAttempts: number,
		failedProviders: Set<string>,
		attemptedProviders: Set<string>,
		excludeQuestions?: string[]
	): Promise<TriviaQuestion> {
		let lastError: Error | null = null;

		try {
			logger.providerStats('question_generation', {
				context: 'AiProvidersService',
				topic,
				difficulty,
				totalProviders: this.llmProviders.length,
				lastSuccessful: this.lastSuccessfulProvider || undefined,
			});

			// Calculate available providers (not permanently failed)
			const availableProviders = this.llmProviders.filter(p => !this.permanentlyFailedProviders.has(p.name));
			const actualMaxAttempts = Math.min(maxAttempts, availableProviders.length);

			for (let attempt = 0; attempt < actualMaxAttempts; attempt++) {
				// At the start of each iteration, check if lastSuccessfulProvider was updated by another parallel request
				// This allows us to immediately use a provider that another request just discovered works
				const currentLastSuccessful = this.lastSuccessfulProvider;

				let provider:
					| (ClaudeTriviaProvider | GeminiTriviaProvider | ChatGPTTriviaProvider | GroqTriviaProvider)
					| null = null;
				let providerName = 'unknown';

				// First, try the last successful provider if it's available and hasn't been attempted
				// Check both the cached value and the current value to catch updates during the loop
				if (
					currentLastSuccessful &&
					!failedProviders.has(currentLastSuccessful) &&
					!attemptedProviders.has(currentLastSuccessful)
				) {
					const lastSuccessful = this.llmProviders.find(p => p.name === currentLastSuccessful);
					if (lastSuccessful) {
						provider = lastSuccessful;
						providerName = currentLastSuccessful;
						attemptedProviders.add(providerName);
						logger.providerStats('using_last_successful', {
							context: 'AiProvidersService',
							provider: providerName,
							attempt: attempt + 1,
							topic,
							difficulty,
						});
					}
				}

				// If last successful provider not available, check again if it was updated by another parallel request
				// This polling mechanism allows us to catch updates during the loop
				if (!provider) {
					const updatedLastSuccessful = this.lastSuccessfulProvider;
					if (
						updatedLastSuccessful &&
						updatedLastSuccessful !== currentLastSuccessful &&
						!failedProviders.has(updatedLastSuccessful) &&
						!attemptedProviders.has(updatedLastSuccessful)
					) {
						const lastSuccessful = this.llmProviders.find(p => p.name === updatedLastSuccessful);
						if (lastSuccessful) {
							provider = lastSuccessful;
							providerName = updatedLastSuccessful;
							attemptedProviders.add(providerName);
							logger.providerStats('using_updated_last_successful', {
								context: 'AiProvidersService',
								provider: providerName,
								attempt: attempt + 1,
								topic,
								difficulty,
							});
						}
					}
				}

				// If still no provider, find next available provider
				if (!provider) {
					for (let i = 0; i < this.llmProviders.length; i++) {
						const testProvider = this.llmProviders[this.currentProviderIndex];
						const testProviderName = testProvider.name;

						if (!failedProviders.has(testProviderName) && !attemptedProviders.has(testProviderName)) {
							provider = testProvider;
							providerName = testProviderName;
							this.currentProviderIndex = (this.currentProviderIndex + 1) % this.llmProviders.length;
							attemptedProviders.add(testProviderName);
							break;
						}

						this.currentProviderIndex = (this.currentProviderIndex + 1) % this.llmProviders.length;
					}
				}

				// If no available provider found, try any provider that hasn't been attempted yet
				if (!provider) {
					for (let i = 0; i < this.llmProviders.length; i++) {
						const testProvider = this.llmProviders[i];
						const testProviderName = testProvider.name;

						if (!attemptedProviders.has(testProviderName)) {
							provider = testProvider;
							providerName = testProviderName;
							attemptedProviders.add(testProviderName);
							break;
						}
					}
				}

				if (!provider) {
					// All available providers have been attempted
					break; // Exit loop instead of throwing immediately
				}

				try {
					const providerStartTime = Date.now();

					this.updateProviderStats(providerName, 'request');

					const question = await ('generateTriviaQuestion' in provider &&
					typeof provider.generateTriviaQuestion === 'function'
						? provider.generateTriviaQuestion(topic, difficulty, excludeQuestions)
						: Promise.reject(new Error('Provider does not support trivia question generation')));

					const duration = Date.now() - startTime;
					const providerDuration = Date.now() - providerStartTime;

					this.updateProviderStats(providerName, 'success', providerDuration);

					// Remember this provider as successful for future calls
					// This is shared across all parallel question generation calls
					// Update is atomic in JavaScript (single-threaded), but we log it for tracking
					const previousSuccessful = this.lastSuccessfulProvider;
					this.lastSuccessfulProvider = providerName;

					// Log the update if it changed, so we can track when parallel requests benefit from it
					if (previousSuccessful !== providerName) {
						logger.providerStats('last_successful_provider_updated', {
							context: 'AiProvidersService',
							provider: providerName,
							previousProvider: previousSuccessful || undefined,
							lastSuccessful: providerName,
							topic,
							difficulty,
							attempt: attempt + 1,
						});
					}

					// Remove from temporary failures if it was there
					this.temporaryFailedProviders.delete(providerName);

					logger.providerSuccess(providerName, {
						context: 'AiProvidersService',
						topic,
						difficulty,
						duration,
						providerDuration,
						attempt: attempt + 1,
						questionId: question.id,
					});

					return question;
				} catch (error) {
					lastError = ensureErrorObject(error);

					// Check if it's an auth error (401) or rate limit error (429)
					const isAuthError = isProviderAuthError(lastError);
					const isRateLimitError = isProviderRateLimitError(lastError);
					const hasStatusCode401 =
						isProviderErrorWithStatusCode(lastError) && lastError.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED;
					const hasStatusCode429 =
						isProviderErrorWithStatusCode(lastError) && lastError.statusCode === HTTP_STATUS_CODES.TOO_MANY_REQUESTS;

					if (isAuthError || hasStatusCode401) {
						// Permanently mark provider as failed (shared across all calls)
						this.permanentlyFailedProviders.add(providerName);
						failedProviders.add(providerName);

						// If this was the last successful provider, clear it
						if (this.lastSuccessfulProvider === providerName) {
							this.lastSuccessfulProvider = null;
						}

						logger.providerError(providerName, 'Authentication failed - skipping provider permanently', {
							context: 'AiProvidersService',
							error: getErrorMessage(lastError),
							attempt: attempt + 1,
						});
					} else if (isRateLimitError || hasStatusCode429) {
						// Permanently mark provider as failed for this session (shared across all calls)
						this.permanentlyFailedProviders.add(providerName);
						failedProviders.add(providerName);

						// If this was the last successful provider, clear it
						if (this.lastSuccessfulProvider === providerName) {
							this.lastSuccessfulProvider = null;
						}

						logger.providerError(providerName, 'Rate limit exceeded - skipping provider permanently', {
							context: 'AiProvidersService',
							error: getErrorMessage(lastError),
							attempt: attempt + 1,
						});
					} else {
						// Temporary failures - mark for this call cycle only
						// Will be reset after TEMP_FAILURE_RESET_TIME
						this.temporaryFailedProviders.set(providerName, Date.now());
						failedProviders.add(providerName);

						logger.providerFallback(providerName, {
							context: 'AiProvidersService',
							error: getErrorMessage(lastError),
							attempt: attempt + 1,
						});
					}

					this.updateProviderStats(providerName, 'failure');

					// Before continuing to next iteration, check if lastSuccessfulProvider was updated
					// This allows us to immediately switch to a provider that another request just discovered works
					const newlySuccessfulProvider = this.lastSuccessfulProvider;
					if (
						newlySuccessfulProvider &&
						!failedProviders.has(newlySuccessfulProvider) &&
						!attemptedProviders.has(newlySuccessfulProvider) &&
						newlySuccessfulProvider !== providerName
					) {
						// Another request found a working provider, use it immediately
						logger.providerStats('switching_to_newly_successful', {
							context: 'AiProvidersService',
							provider: newlySuccessfulProvider,
							previousProvider: providerName,
							attempt: attempt + 1,
							topic,
							difficulty,
						});
						// Continue to next iteration - it will pick up the newly successful provider at the start
						continue;
					}

					// Check if we've exhausted all available providers
					// Include lastSuccessfulProvider in the check if it exists and hasn't been attempted
					const remainingProviders = this.llmProviders.filter(
						p => !failedProviders.has(p.name) && !attemptedProviders.has(p.name)
					);

					// Also check if lastSuccessfulProvider is available but not attempted
					// This ensures we don't exit the loop prematurely if lastSuccessfulProvider is available
					const hasLastSuccessfulAvailable =
						this.lastSuccessfulProvider &&
						!failedProviders.has(this.lastSuccessfulProvider) &&
						!attemptedProviders.has(this.lastSuccessfulProvider);

					if (hasLastSuccessfulAvailable && !remainingProviders.some(p => p.name === this.lastSuccessfulProvider)) {
						// lastSuccessfulProvider is available but not in remainingProviders list, continue to next iteration
						// The next iteration will pick it up at the start
					} else if (remainingProviders.length === 0) {
						// No more providers available, exit the loop
						break;
					}
				}
			}

			throw lastError || createServerError('generate question after all retries', new Error('All providers failed'));
		} catch (error) {
			logger.providerError('all', getErrorMessage(error), {
				context: 'AiProvidersService',
				topic,
				difficulty,
				totalProviders: this.llmProviders.length,
			});
			throw error;
		}
	}

	/**
	 * Get provider statistics
	 * @returns Provider statistics
	 */
	getProviderStats() {
		const stats = {
			totalProviders: this.llmProviders.length,
			currentProviderIndex: this.currentProviderIndex,
			providers: this.llmProviders.map(provider => provider.name),
			providerDetails: Object.fromEntries(this.providerStats),
		};

		return stats;
	}

	/**
	 * Get provider performance metrics
	 * @returns Performance metrics for all providers
	 */
	getPerformanceMetrics(): Record<string, ProviderStats> {
		return Object.fromEntries(this.providerStats);
	}

	/**
	 * Get the best performing provider
	 * @returns Best provider name or null if no providers available
	 */
	getBestProvider(): string | null {
		if (this.providerStats.size === 0) {
			return null;
		}

		let bestProvider: string | null = null;
		let bestScore = -1;

		this.providerStats.forEach((stats, providerName) => {
			if (stats.status !== 'available') {
				return;
			}

			const successRate = stats.requests > 0 ? stats.successes / stats.requests : 0;
			const avgResponseTime = stats.averageResponseTime ?? 0;

			const score = successRate * 100 - avgResponseTime / 1000;

			if (score > bestScore) {
				bestScore = score;
				bestProvider = providerName;
			}
		});

		return bestProvider;
	}

	/**
	 * Clean up temporary failures that have expired
	 * @private
	 */
	private cleanupTemporaryFailures(): void {
		const now = Date.now();
		for (const [providerName, timestamp] of this.temporaryFailedProviders.entries()) {
			if (now - timestamp >= this.TEMP_FAILURE_RESET_TIME) {
				this.temporaryFailedProviders.delete(providerName);
			}
		}
	}

	/**
	 * Update provider statistics
	 * @param providerName Provider name
	 * @param eventType Event type (request, success, failure)
	 * @param responseTime Response time in milliseconds (optional)
	 */
	private updateProviderStats(
		providerName: string,
		eventType: 'request' | 'success' | 'failure',
		responseTime?: number
	) {
		const stats = this.providerStats.get(providerName);
		if (!stats) {
			return;
		}

		switch (eventType) {
			case 'request':
				stats.requests++;
				break;
			case 'success':
				stats.successes++;
				stats.lastUsed = new Date();
				if (responseTime !== undefined) {
					// Update average response time
					const totalTime = stats.averageResponseTime * (stats.successes - 1) + responseTime;
					stats.averageResponseTime = totalTime / stats.successes;
				}
				break;
			case 'failure':
				stats.failures++;
				break;
		}

		// Update updatedAt timestamp
		stats.updatedAt = new Date();

		this.providerStats.set(providerName, stats);
	}

	/**
	 * Reset provider statistics
	 */
	resetProviderStats() {
		this.providerStats.forEach((_, providerName) => {
			this.providerStats.set(providerName, {
				providerName,
				requests: 0,
				successes: 0,
				failures: 0,
				averageResponseTime: 0,
				lastUsed: null,
				status: 'available',
				successRate: 0,
				errorRate: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		});

		logger.providerStats('reset', {});
	}

	/**
	 * Get provider health status
	 * @returns Health status for all providers
	 */
	getProviderHealth(): Record<string, ProviderStats> {
		return Object.fromEntries(this.providerStats);
	}

	/**
	 * Get available providers count
	 * @returns Number of available providers
	 */
	getAvailableProvidersCount(): number {
		return this.llmProviders.length;
	}

	/**
	 * Get provider names
	 * @returns Array of provider names
	 */
	getProviderNames(): string[] {
		return this.llmProviders.map(provider => provider.name);
	}
}
