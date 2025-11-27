import { HTTP_CLIENT_CONFIG, HTTP_TIMEOUTS } from '@shared/constants';
import type { LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared/types';

import { AI_PROVIDER_NAMES, AI_PROVIDER_PRIORITIES } from '@internal/constants';
import { createValidationError } from '@internal/utils';

import { BaseTriviaProvider } from '.';

/**
 * Gemini Trivia Provider
 *
 * @class GeminiTriviaProvider
 * @description Implements the Gemini AI provider for trivia question generation.
 * Uses Gemini 1.5 Flash model. Priority: AI_PROVIDER_PRIORITIES.GEMINI.
 * Cost: $0.075 per million tokens. Rate limit: 60 requests/minute.
 * @extends BaseTriviaProvider
 * @used_by AiProvidersService
 */
export class GeminiTriviaProvider extends BaseTriviaProvider {
	name = AI_PROVIDER_NAMES.GEMINI;
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider = {
		name: AI_PROVIDER_NAMES.GEMINI,
		config: {
			providerName: AI_PROVIDER_NAMES.GEMINI,
			model: 'gemini-1.5-flash-latest',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.000000075,
			maxTokens: 1000000,
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
		this.apiKey = process.env.GEMINI_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'gemini',
			apiKey: this.apiKey,
			baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`,
			timeout: HTTP_TIMEOUTS.AI_PROVIDER,
			maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: AI_PROVIDER_PRIORITIES[AI_PROVIDER_NAMES.GEMINI],
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				contents: [
					{
						parts: [
							{
								text: prompt,
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.7,
					maxOutputTokens: 512,
				},
			},
		};
	}

	protected parseResponse(response: LLMResponse): LLMTriviaResponse {
		if (
			!response.data ||
			!response.data.candidates ||
			!Array.isArray(response.data.candidates) ||
			response.data.candidates.length === 0
		) {
			throw createValidationError(this.getProviderErrorMessageKey(), 'string');
		}
		const content = response.data.candidates[0].content.parts[0].text;
		return this.parseLLMContentToTriviaResponse(content);
	}
}
