/**
 * AI Providers Service
 *
 * @module AiProvidersService
 * @description Service for managing multiple AI providers with load balancing and fallback
 * @used_by server/features/game/logic/trivia-generation.service.ts (TriviaGenerationService.generateQuestion)
 */
import { Injectable } from '@nestjs/common';
import { PROVIDER_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import {
	AIProviderWithTrivia,
	LLMProvider,
	ProviderHealth,
	ProviderMetrics,
	ProviderStats,
	TriviaQuestion,
} from 'everytriv-shared/types';
import { roundToDecimals } from 'everytriv-shared/utils';

import { LoggerService } from '../../../../../shared/controllers';
import {
	AnthropicTriviaProvider,
	GoogleTriviaProvider,
	MistralTriviaProvider,
	OpenAITriviaProvider,
} from '../implementations';

/**
 * Service for managing multiple AI providers with load balancing and fallback
 * @class AiProvidersService
 * @description Implements round-robin selection and automatic failover between AI providers
 * @used_by server/features/game/logic/trivia-generation.service.ts (trivia question generation)
 */
@Injectable()
export class AiProvidersService {
	private llmProviders: AIProviderWithTrivia[] = [];
	private currentProviderIndex = 0;
	private providerStats: Map<string, ProviderStats> = new Map();

	constructor(private readonly logger: LoggerService) {
		this.initializeProviders();
	}

	/**
	 * Initialize available AI providers based on environment variables
	 * @private
	 */
	private initializeProviders(): void {
		const providers = [
			new OpenAITriviaProvider(),
			new AnthropicTriviaProvider(),
			new GoogleTriviaProvider(),
			new MistralTriviaProvider(),
		];

		this.llmProviders = providers.filter(provider => {
			const hasApiKey = provider.hasApiKey();
			if (!hasApiKey) {
				this.logger.providerConfig(provider.name, {
					context: 'AiProvidersService',
				});
			}
			return hasApiKey;
		}) as AIProviderWithTrivia[];

		if (this.llmProviders.length === 0) {
			this.logger.providerError('all', 'No AI providers configured', {
				context: 'AiProvidersService',
			});
		}

		// Initialize stats for each provider
		this.llmProviders.forEach(provider => {
			this.providerStats.set(provider.name, {
				requests: 0,
				successes: 0,
				failures: 0,
				averageResponseTime: 0,
				lastUsed: null,
				status: 'available',
			});
		});
	}

	/**
	 * Get the next available AI provider in round-robin fashion
	 * @returns LLMProvider The next provider to use
	 * @throws Error - When no providers are available
	 */
	private getNextProvider(): LLMProvider {
		if (this.llmProviders.length === 0) {
			throw new Error(PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE);
		}

		const provider = this.llmProviders[this.currentProviderIndex];
		this.currentProviderIndex = (this.currentProviderIndex + 1) % this.llmProviders.length;
		return provider;
	}

	/**
	 * Generate a new trivia question using AI providers with retry logic and performance optimization
	 * @param topic The topic for the trivia question
	 * @param difficulty The difficulty level
	 * @param language The language for the question
	 * @returns Promise<TriviaQuestion> The generated question
	 */
	async generateQuestion(topic: string, difficulty: string, language: string = 'he'): Promise<TriviaQuestion> {
		const startTime = Date.now();
		const maxRetries = 2;
		let lastError: Error | null = null;

		try {
			this.logger.providerStats('question_generation', {
				context: 'AiProvidersService',
				topic,
				difficulty,
				language,
			});

			// Try each provider with retry logic
			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const provider = this.getNextProvider();
					const providerName = provider.name;
					const providerStartTime = Date.now();

					// Update provider stats
					this.updateProviderStats(providerName, 'request');

					const question = await provider.generateTriviaQuestion(topic, difficulty);

					const duration = Date.now() - startTime;
					const providerDuration = Date.now() - providerStartTime;

					// Update provider stats on success
					this.updateProviderStats(providerName, 'success', providerDuration);

					// Log success with comprehensive metrics
					this.logger.providerSuccess(providerName, {
						context: 'AiProvidersService',
						topic,
						difficulty,
						language,
						duration,
						providerDuration,
						attempt: attempt + 1,
						questionId: question.id,
					});

					return question;
				} catch (error) {
					const providerName = (this.llmProviders[this.currentProviderIndex - 1] || {}).name || 'unknown';
					lastError = error instanceof Error ? error : new Error('Unknown error');

					// Update provider stats on failure
					this.updateProviderStats(providerName, 'failure');

					this.logger.providerFallback(providerName, {
						context: 'AiProvidersService',
						error: lastError.message,
						attempt: attempt + 1,
						maxRetries,
					});

					// If this was the last attempt, throw the error
					if (attempt === maxRetries) {
						throw lastError;
					}
				}
			}

			throw lastError || new Error('Failed to generate question after all retries');
		} catch (error) {
			this.logger.providerError('all', error instanceof Error ? error.message : 'Unknown error', {
				context: 'AiProvidersService',
				topic,
				difficulty,
				language,
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
	getPerformanceMetrics(): Record<string, ProviderMetrics> {
		const metrics: Record<string, ProviderMetrics> = {};

		this.providerStats.forEach((stats, providerName) => {
			const successRate = stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0;
			metrics[providerName] = {
				providerName,
				totalRequests: stats.requests,
				successfulRequests: stats.successes,
				failedRequests: stats.failures,
				averageResponseTime: stats.averageResponseTime,
				successRate: roundToDecimals(successRate, 2),
				errorRate: stats.requests > 0 ? (stats.failures / stats.requests) * 100 : 0,
				lastUsed: stats.lastUsed?.toISOString(),
				status: stats.status,
			};
		});

		return metrics;
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
			const avgResponseTime = stats.averageResponseTime || 0;

			// Score based on success rate and response time
			const score = successRate * 100 - avgResponseTime / 1000; // Convert to seconds

			if (score > bestScore) {
				bestScore = score;
				bestProvider = providerName;
			}
		});

		return bestProvider;
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

		this.providerStats.set(providerName, stats);
	}

	/**
	 * Reset provider statistics
	 */
	resetProviderStats() {
		this.providerStats.forEach((_, providerName) => {
			this.providerStats.set(providerName, {
				requests: 0,
				successes: 0,
				failures: 0,
				averageResponseTime: 0,
				lastUsed: null,
				status: 'available',
			});
		});

		this.logger.providerStats('reset', {});
	}

	/**
	 * Get provider health status
	 * @returns Health status for all providers
	 */
	getProviderHealth(): Record<string, ProviderHealth> {
		const health: Record<string, ProviderHealth> = {};

		this.providerStats.forEach((stats, providerName) => {
			const successRate = stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0;
			const isHealthy = successRate >= 80 && stats.status === 'available';

			health[providerName] = {
				providerName,
				status: isHealthy ? 'healthy' : 'unhealthy',
				responseTime: stats.averageResponseTime,
				errorCount: stats.failures,
				successCount: stats.successes,
				lastCheck: new Date().toISOString(),
			};
		});

		return health;
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
