import { HTTP_CLIENT_CONFIG, HTTP_TIMEOUTS } from '@shared/constants';
import type { AIProviderInstance, LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared/types';

import { AI_PROVIDER_NAMES, AI_PROVIDER_PRIORITIES } from '@internal/constants';
import { createValidationError } from '@internal/utils';

import { BaseTriviaProvider } from '.';
import { PromptTemplates } from '../prompts';

/**
 * Groq Trivia Provider
 *
 * @class GroqTriviaProvider
 * @description Implements the Groq AI provider for trivia question generation.
 * Uses free tier with Llama 3.1 8B model. Priority: AI_PROVIDER_PRIORITIES.GROQ (highest - selected first).
 * Cost: $0 per token. Rate limit: 30 requests/minute.
 * @extends BaseTriviaProvider
 * @used_by AiProvidersService
 */
export class GroqTriviaProvider extends BaseTriviaProvider {
	name = AI_PROVIDER_NAMES.GROQ;
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider: AIProviderInstance = {
		name: AI_PROVIDER_NAMES.GROQ,
		config: {
			providerName: AI_PROVIDER_NAMES.GROQ,
			model: 'llama-3.1-8b-instant',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 30,
				tokensPerMinute: 30000,
			},
			costPerToken: 0,
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
		super();
		this.apiKey = process.env.GROQ_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'groq',
			apiKey: this.apiKey,
			baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
			timeout: HTTP_TIMEOUTS.AI_PROVIDER,
			maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: AI_PROVIDER_PRIORITIES[AI_PROVIDER_NAMES.GROQ],
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				model: 'llama-3.1-8b-instant',
				messages: [
					{
						role: 'system',
						content: PromptTemplates.getSystemPrompt(),
					},
					{ role: 'user', content: prompt },
				],
				temperature: 0.7,
				max_tokens: 512,
			},
		};
	}

	protected parseResponse(response: LLMResponse): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
			throw createValidationError(this.getProviderErrorMessageKey(), 'string');
		}
		const content = data.choices[0].message.content;
		return this.parseLLMContentToTriviaResponse(content);
	}
}
