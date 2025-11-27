/**
 * ChatGPT Trivia Provider
 *
 * @module OpenAITriviaProvider
 * @description ChatGPT API integration for trivia question generation
 * @used_by server/src/features/game/logic (AiProvidersService.initializeProviders)
 */
import { HTTP_CLIENT_CONFIG, HTTP_TIMEOUTS } from '@shared/constants';
import type { AIProviderInstance, LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared/types';

import { AI_PROVIDER_NAMES, AI_PROVIDER_PRIORITIES } from '@internal/constants';
import { createValidationError } from '@internal/utils';

import { BaseTriviaProvider } from '.';
import { PromptTemplates } from '../prompts';

/**
 * ChatGPT provider for trivia question generation
 * @class ChatGPTTriviaProvider
 * @extends BaseTriviaProvider
 * @description Handles trivia generation using ChatGPT models.
 * Uses GPT-4o-mini model. Priority: AI_PROVIDER_PRIORITIES.CHATGPT.
 * Cost: $0.15 per million tokens. Rate limit: 60 requests/minute.
 * @used_by server/src/features/game/logic (round-robin provider selection)
 */
export class ChatGPTTriviaProvider extends BaseTriviaProvider {
	name = AI_PROVIDER_NAMES.CHATGPT;
	protected apiKey: string;

	provider: AIProviderInstance = {
		name: AI_PROVIDER_NAMES.CHATGPT,
		config: {
			providerName: AI_PROVIDER_NAMES.CHATGPT,
			model: 'gpt-4o-mini',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.00000015,
			maxTokens: 16384,
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
		this.apiKey = process.env.CHATGBT_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'chatgpt',
			apiKey: this.apiKey,
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			timeout: HTTP_TIMEOUTS.AI_PROVIDER,
			maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: AI_PROVIDER_PRIORITIES[AI_PROVIDER_NAMES.CHATGPT],
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				model: 'gpt-4o-mini',
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
