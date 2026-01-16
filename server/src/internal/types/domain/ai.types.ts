import { DifficultyLevel, LLMResponseStatus, ProviderStatus } from '@shared/constants';
import type { BaseTimestamps, BaseTriviaConfig, BasicValue, TriviaAnswer, TriviaQuestion } from '@shared/types';

export interface LLMQuestion {
	question: string;
	answers: TriviaAnswer[];
}

export interface LLMTriviaResponse {
	questions: LLMQuestion[];
	explanation?: string;
	content: string;
	status: LLMResponseStatus;
	validationSummary?: string;
	metadata?: {
		provider: string;
		responseTime: number;
		tokenCount?: number;
		qualityScore?: number;
		confidenceScore?: number;
		warnings?: string[];
	};
}

export interface TriviaLLMJsonPayload {
	question: string;
	answers: string[];
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

export interface ProviderStats extends BaseTimestamps {
	providerName: string;
	requests: number;
	successes: number;
	failures: number;
	averageResponseTime: number;
	successRate: number;
	errorRate: number;
	lastUsed: Date | null;
	status: ProviderStatus;
}

export interface PromptParams extends BaseTriviaConfig {
	answerCount: number;
	customInstructions?: string;
	isCustomDifficulty?: boolean;
	options?: {
		includeExplanation?: boolean;
		includeHints?: boolean;
		includeReferences?: boolean;
		qualityCheck?: boolean;
	};
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
