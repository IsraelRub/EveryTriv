import { LLMResponse, LLMTriviaResponse, ProviderConfig, createValidationError } from '@shared';

import { BaseTriviaProvider } from '../implementations';

export class GoogleTriviaProvider extends BaseTriviaProvider {
	name = 'Google';
	protected apiKey: string;

	// Provider instance for AIProviderWithTrivia interface
	provider = {
		name: 'Google',
		config: {
			providerName: 'Google',
			model: 'gemini-1.5-pro',
			version: '1.0',
			capabilities: ['trivia-generation'],
			rateLimit: {
				requestsPerMinute: 60,
				tokensPerMinute: 150000,
			},
			costPerToken: 0.000001,
			maxTokens: 8192,
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
		this.apiKey = process.env.GOOGLE_API_KEY || '';
	}

	protected getProviderConfig(prompt: string): ProviderConfig {
		return {
			name: 'google',
			apiKey: this.apiKey,
			baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`,
			timeout: 30000,
			maxRetries: 3,
			enabled: true,
			priority: 2,
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
			throw createValidationError('Google response format', 'string');
		}
		const content = response.data.candidates[0].content.parts[0].text;
		return JSON.parse(content);
	}
}
