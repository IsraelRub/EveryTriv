import { HTTP_CLIENT_CONFIG, HTTP_TIMEOUTS } from '@shared/constants';
import type { LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared/types';
import { createValidationError } from '@internal/utils';

import { BaseTriviaProvider } from './base.provider';

export class AnthropicTriviaProvider extends BaseTriviaProvider {
	name = 'Anthropic';
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider = {
		name: 'Anthropic',
		config: {
			providerName: 'Anthropic',
			model: 'claude-3-5-sonnet-20241022',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.000003,
			maxTokens: 4096,
			supportedLanguages: ['en', 'he'],
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
		this.apiKey = process.env.ANTHROPIC_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'anthropic',
			apiKey: this.apiKey,
		baseUrl: 'https://api.anthropic.com/v1/messages',
		timeout: HTTP_TIMEOUTS.AI_PROVIDER,
		maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: 1,
			headers: {
				'x-api-key': this.apiKey,
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
			},
			body: {
				model: 'claude-3-5-sonnet-20241022',
				max_tokens: 512,
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
			throw createValidationError('Anthropic response format', 'string');
		}
		const content = response.data.content[0].text;
		return JSON.parse(content);
	}
}
