import { DifficultyLevel, type Locale } from '@shared/constants';
import type { BasicValue, GameDifficulty, TriviaQuestion, TriviaQuestionCore } from '@shared/types';

import { LLMResponseStatus, type TriviaGenerationDeclinedReason } from '@internal/constants';

export interface LLMTriviaResponse {
	questions: TriviaQuestionCore[];
	explanation?: string;
	content: string;
	status: LLMResponseStatus;
	validationSummary?: string;
	declinedReason?: TriviaGenerationDeclinedReason;
}

export interface TriviaLLMJsonPayload {
	question: string;
	answers: string[];
	generationDeclinedReason?: TriviaGenerationDeclinedReason;
}

export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	timeout: number;
	maxRetries: number;
	enabled: boolean;
	priority: number;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
}

export interface PromptParams {
	topic: string;
	difficulty: GameDifficulty;
	answerCount: number;
	outputLanguageLabel: string;
	outputLanguage?: Locale;
	excludeQuestions?: string[];
	isCustomDifficulty?: boolean;
}

export interface LLMResponse {
	content: string;
	data?: {
		content?: { text: string }[];
		candidates?: { content: { parts: { text: string }[] } }[];
		choices?: { message: { content: string } }[];
	};
	metadata?: Record<string, BasicValue>;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

export interface AIProviderInstance {
	name: string;
	config: {
		model: string;
		version: string;
		capabilities: string[];
		rateLimit: {
			requestsPerMinute: number;
			tokensPerMinute: number;
		};
		costPerToken: number;
		maxTokens: number;
		lastUpdated: Date;
	};
	isAvailable: boolean;
	lastCheck: Date;
	errorCount: number;
	successCount: number;
	averageResponseTime: number;
	currentLoad: number;
}

export interface ProviderTriviaGenerationResult {
	question: Omit<TriviaQuestion, 'id'>;
	mappedDifficulty?: DifficultyLevel;
}
