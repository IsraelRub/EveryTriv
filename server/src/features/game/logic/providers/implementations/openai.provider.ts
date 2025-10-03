/**
 * OpenAI Trivia Provider
 *
 * @module OpenAITriviaProvider
 * @description OpenAI API integration for trivia question generation
 * @used_by server/src/features/game/logic (AiProvidersService.initializeProviders)
 */
import { createValidationError, LLMResponse, LLMTriviaResponse, ProviderConfig } from '@shared';

import { BaseTriviaProvider } from '../implementations';
import { PromptTemplates } from '../prompts';

/**
 * OpenAI provider for trivia question generation
 * @class OpenAITriviaProvider
 * @extends BaseTriviaProvider
 * @description Handles trivia generation using OpenAI's GPT models
 * @used_by server/src/features/game/logic (round-robin provider selection)
 */
export class OpenAITriviaProvider extends BaseTriviaProvider {
	name = 'OpenAI';
	protected apiKey: string;

	provider = {
		name: 'OpenAI',
		config: {
			providerName: 'OpenAI',
			model: 'gpt-3.5-turbo',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.000002,
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
		this.apiKey = process.env.OPENAI_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'openai',
			apiKey: this.apiKey,
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			timeout: 30000,
			maxRetries: 3,
			enabled: true,
			priority: 4,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				model: 'gpt-3.5-turbo',
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
			throw createValidationError('OpenAI response format', 'string');
		}
		const content = data.choices[0].message.content;
		return JSON.parse(content);
	}
}
