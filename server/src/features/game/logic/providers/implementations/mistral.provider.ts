import { PROVIDER_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import { LLMApiResponse, LLMTriviaResponse, MistralResponse, ProviderConfig } from 'everytriv-shared/types';

import { BaseTriviaProvider } from '../implementations';
import { PromptTemplates } from '../prompts';

export class MistralTriviaProvider extends BaseTriviaProvider<MistralResponse> {
	name = 'Mistral';
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider = {
		name: 'Mistral',
		config: {
			providerName: 'Mistral',
			model: 'mistral-large-latest',
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
		this.apiKey = process.env.MISTRAL_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			url: 'https://api.mistral.ai/v1/chat/completions',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				model: 'mistral-large-latest',
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

	protected parseResponse(response: LLMApiResponse<MistralResponse>): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
			throw new Error(PROVIDER_ERROR_MESSAGES.INVALID_MISTRAL_RESPONSE);
		}
		const content = data.choices[0].message.content;
		return JSON.parse(content) as LLMTriviaResponse;
	}
}
