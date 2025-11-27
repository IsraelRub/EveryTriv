import { HTTP_CLIENT_CONFIG, HTTP_TIMEOUTS } from '@shared/constants';
import type { AIProviderInstance, LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared/types';

import { AI_PROVIDER_NAMES, AI_PROVIDER_PRIORITIES } from '@internal/constants';
import { createValidationError } from '@internal/utils';

import { BaseTriviaProvider } from './base.provider';

/**
 * Claude Trivia Provider
 *
 * @class ClaudeTriviaProvider
 * @description Implements the Claude AI provider for trivia question generation.
 * Uses Claude 3.5 Haiku model. Priority: AI_PROVIDER_PRIORITIES.CLAUDE (lowest - highest cost).
 * Cost: $0.25 per million tokens. Rate limit: 60 requests/minute.
 * @extends BaseTriviaProvider
 * @used_by AiProvidersService
 */
export class ClaudeTriviaProvider extends BaseTriviaProvider {
	name = AI_PROVIDER_NAMES.CLAUDE;
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider: AIProviderInstance = {
		name: AI_PROVIDER_NAMES.CLAUDE,
		config: {
			providerName: AI_PROVIDER_NAMES.CLAUDE,
			model: 'claude-3-5-haiku-20241022',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.00000025,
			maxTokens: 200000,
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
		super();
		this.apiKey = process.env.CLAUDE_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		// Claude API requires system prompt and proper format
		const systemPrompt = `You are an expert trivia question generator. Generate high-quality, factual trivia questions in JSON format.`;

		return {
			name: 'claude',
			apiKey: this.apiKey,
			baseUrl: 'https://api.anthropic.com/v1/messages',
			timeout: HTTP_TIMEOUTS.AI_PROVIDER,
			maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: AI_PROVIDER_PRIORITIES[AI_PROVIDER_NAMES.CLAUDE],
			headers: {
				'x-api-key': this.apiKey,
				'anthropic-version': '2023-06-01',
				'Content-Type': 'application/json',
			},
			body: {
				model: 'claude-3-5-haiku-20241022',
				max_tokens: 1024, // Increased to ensure complete JSON response
				system: systemPrompt,
				messages: [
					{
						role: 'user',
						content: prompt,
					},
				],
			},
		};
	}

	protected parseResponse(response: LLMResponse): LLMTriviaResponse {
		if (
			!response.data ||
			!response.data.content ||
			!Array.isArray(response.data.content) ||
			response.data.content.length === 0
		) {
			throw createValidationError(this.getProviderErrorMessageKey(), 'string');
		}
		const content = response.data.content[0].text;
		return this.parseLLMContentToTriviaResponse(content);
	}
}
