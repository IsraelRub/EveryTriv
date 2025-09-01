import { PROVIDER_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import { AnthropicResponse, LLMApiResponse, LLMTriviaResponse, ProviderConfig } from 'everytriv-shared/types';

import { BaseTriviaProvider } from '../implementations';

export class AnthropicTriviaProvider extends BaseTriviaProvider<AnthropicResponse> {
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
			url: 'https://api.anthropic.com/v1/messages',
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

	protected parseResponse(response: LLMApiResponse<AnthropicResponse>): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
			throw new Error(PROVIDER_ERROR_MESSAGES.INVALID_ANTHROPIC_RESPONSE);
		}
		const content = data.content[0].text;
		return JSON.parse(content) as LLMTriviaResponse;
	}
}
