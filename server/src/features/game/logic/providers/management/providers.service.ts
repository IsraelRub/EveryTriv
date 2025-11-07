/**
 * AI Providers Service
 *
 * @module AiProvidersService
 * @description Service for managing multiple AI providers with load balancing and fallback
 * @used_by server/src/features/game/logic
 */
import { Injectable } from '@nestjs/common';

import { PROVIDER_ERROR_MESSAGES } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { GameDifficulty, ProviderStats, TriviaQuestion } from '@shared/types';
import { ensureErrorObject, getErrorMessage } from '@shared/utils';

import { createServerError } from '@internal/utils';

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
	private llmProviders: (
		| AnthropicTriviaProvider
		| GoogleTriviaProvider
		| MistralTriviaProvider
		| OpenAITriviaProvider
	)[] = [];
	private currentProviderIndex = 0;
	private providerStats: Map<string, ProviderStats> = new Map();

	constructor() {
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
			const hasApiKey =
				'hasApiKey' in provider && typeof provider.hasApiKey === 'function' ? provider.hasApiKey() : false;
			if (!hasApiKey) {
				logger.providerConfig(provider.name, {
					context: 'AiProvidersService',
				});
			}
			return hasApiKey;
		});

		if (this.llmProviders.length === 0) {
			logger.providerError('all', 'No AI providers configured', {
				context: 'AiProvidersService',
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
	 * Get the next available AI provider in round-robin fashion
	 * @returns LLMProvider The next provider to use
	 * @throws Error - When no providers are available
	 */
	private getNextProvider():
		| (AnthropicTriviaProvider | GoogleTriviaProvider | MistralTriviaProvider | OpenAITriviaProvider)
		| null {
		if (this.llmProviders.length === 0) {
			throw createServerError('get AI provider', new Error(PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE));
		}

		const provider = this.llmProviders[this.currentProviderIndex];
		this.currentProviderIndex = (this.currentProviderIndex + 1) % this.llmProviders.length;
		return provider;
	}

	/**
	 * Generate a new trivia question using AI providers with retry logic and performance optimization
	 * @param topic The topic for the trivia question
	 * @param difficulty The difficulty level
	 * @returns Promise<TriviaQuestion> The generated question
	 */
	async generateQuestion(topic: string, difficulty: GameDifficulty): Promise<TriviaQuestion> {
		const startTime = Date.now();
		const maxRetries = 2;
		let lastError: Error | null = null;

		try {
			logger.providerStats('question_generation', {
				context: 'AiProvidersService',
				topic,
				difficulty,
			});

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const provider = this.getNextProvider();
					if (!provider) {
						throw createServerError('get AI provider', new Error(PROVIDER_ERROR_MESSAGES.NO_PROVIDERS_AVAILABLE));
					}
					const providerName = provider.name;
					const providerStartTime = Date.now();

					this.updateProviderStats(providerName, 'request');

					const question = await ('generateTriviaQuestion' in provider &&
					typeof provider.generateTriviaQuestion === 'function'
						? provider.generateTriviaQuestion(topic, difficulty)
						: Promise.reject(new Error('Provider does not support trivia question generation')));

					const duration = Date.now() - startTime;
					const providerDuration = Date.now() - providerStartTime;

					this.updateProviderStats(providerName, 'success', providerDuration);

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
					const providerName = (this.llmProviders[this.currentProviderIndex - 1] || {}).name || 'unknown';
					lastError = ensureErrorObject(error);

					this.updateProviderStats(providerName, 'failure');

					logger.providerFallback(providerName, {
						context: 'AiProvidersService',
						error: lastError.message,
						attempt: attempt + 1,
						maxRetries,
					});

					if (attempt === maxRetries) {
						throw lastError;
					}
				}
			}

			throw lastError || createServerError('generate question after all retries', new Error('All providers failed'));
		} catch (error) {
			logger.providerError('all', getErrorMessage(error), {
				context: 'AiProvidersService',
				topic,
				difficulty,
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
