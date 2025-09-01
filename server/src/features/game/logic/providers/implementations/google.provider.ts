import { PROVIDER_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import { GoogleResponse, LLMApiResponse, LLMTriviaResponse, ProviderConfig } from 'everytriv-shared/types';

import { BaseTriviaProvider } from '../implementations';

export class GoogleTriviaProvider extends BaseTriviaProvider<GoogleResponse> {
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
			url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`,
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

	protected parseResponse(response: LLMApiResponse<GoogleResponse>): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
			throw new Error(PROVIDER_ERROR_MESSAGES.INVALID_GOOGLE_RESPONSE);
		}
		const content = data.candidates[0].content.parts[0].text;
		return JSON.parse(content) as LLMTriviaResponse;
	}
}
