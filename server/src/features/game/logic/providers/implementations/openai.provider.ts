/**
 * OpenAI Trivia Provider
 *
 * @module OpenAITriviaProvider
 * @description OpenAI API integration for trivia question generation
 * @used_by server/features/game/logic/aiProviders/aiProviders.service.ts (AiProvidersService.initializeProviders)
 */
import { PROVIDER_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import { LLMApiResponse, LLMTriviaResponse, OpenAIResponse, ProviderConfig } from 'everytriv-shared/types';

import { BaseTriviaProvider } from '../implementations';
import { PromptTemplates } from '../prompts';

/**
 * OpenAI provider for trivia question generation
 * @class OpenAITriviaProvider
 * @extends BaseTriviaProvider
 * @description Handles trivia generation using OpenAI's GPT models
 * @used_by server/features/game/logic/aiProviders/aiProviders.service.ts (round-robin provider selection)
 */
export class OpenAITriviaProvider extends BaseTriviaProvider<OpenAIResponse> {
	name = 'OpenAI';
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
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
			url: 'https://api.openai.com/v1/chat/completions',
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

	protected parseResponse(response: LLMApiResponse<OpenAIResponse>): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
			throw new Error(PROVIDER_ERROR_MESSAGES.INVALID_OPENAI_RESPONSE);
		}
		const content = data.choices[0].message.content;
		return JSON.parse(content) as LLMTriviaResponse;
	}
}
