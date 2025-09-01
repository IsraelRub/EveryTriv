/**
 * AI-related types for EveryTriv
 * Shared between client and server
 *
 * @module AiTypes
 * @description AI provider interfaces and data structures
 */
import type { GenericDataValue } from './data.types';
import type { TriviaQuestion } from './game.types';

/**
 * Provider statistics interface
 * @interface ProviderStats
 * @description Statistics for AI provider management and load balancing
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts (getProviderStats)
 */
export interface ProviderStats {
	/** Total number of requests made to this provider */
	requests: number;
	/** Number of successful requests */
	successes: number;
	/** Number of failed requests */
	failures: number;
	/** Average response time in milliseconds */
	averageResponseTime: number;
	/** Last time the provider was used */
	lastUsed: Date | null;
	/** Current status of the provider */
	status: 'available' | 'unavailable' | 'error';
}

/**
 * Provider metrics interface
 * @interface ProviderMetrics
 * @description Performance metrics for AI providers
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts (getPerformanceMetrics)
 */
export interface ProviderMetrics {
	/** Provider name */
	providerName: string;
	/** Total number of requests */
	totalRequests: number;
	/** Number of successful requests */
	successfulRequests: number;
	/** Number of failed requests */
	failedRequests: number;
	/** Average response time in milliseconds */
	averageResponseTime: number;
	/** Success rate percentage */
	successRate: number;
	/** Error rate percentage */
	errorRate: number;
	/** Last used timestamp */
	lastUsed?: string;
	/** Current status */
	status: string;
}

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Health status for AI providers
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts (getProviderHealth)
 */
export interface ProviderHealth {
	/** Provider name */
	providerName: string;
	/** Health status */
	status: 'healthy' | 'unhealthy';
	/** Average response time */
	responseTime: number;
	/** Number of errors */
	errorCount: number;
	/** Number of successes */
	successCount: number;
	/** Last health check timestamp */
	lastCheck: string;
}

/**
 * Core trivia provider interface
 * @interface TriviaProvider
 * @description Core interface for trivia question providers
 * @used_by server/src/features/game/logic/providers/management/base.provider.ts (BaseTriviaProvider)
 */
export interface TriviaProvider {
	/** Generate trivia question */
	generateTriviaQuestion(topic: string, difficulty: string): Promise<TriviaQuestion>;
	/** Check if provider has API key */
	hasApiKey(): boolean;
	/** Provider name */
	name: string;
}

/**
 * Provider manager interface
 * @interface ProviderManager
 * @description Interface for managing multiple AI providers
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts (AiProvidersService)
 */
export interface ProviderManager {
	/** Generate question using available providers */
	generateQuestion(topic: string, difficulty: string, language: string): Promise<TriviaQuestion>;
	/** Get provider statistics */
	getProviderStats(): ProviderStats;
	/** Get performance metrics for all providers */
	getPerformanceMetrics(): Record<string, ProviderMetrics>;
	/** Get the best performing provider */
	getBestProvider(): string | null;
	/** Get provider health status */
	getProviderHealth(): Record<string, ProviderHealth>;
	/** Get number of available providers */
	getAvailableProvidersCount(): number;
	/** Get provider names */
	getProviderNames(): string[];
	/** Reset provider statistics */
	resetProviderStats(): void;
}

/**
 * AI provider configuration interface
 * @interface AiProviderConfig
 * @description Configuration settings for AI providers
 * @used_by server/src/features/game/logic/providers/implementations (provider implementations)
 */
export interface AiProviderConfig {
	/** Provider name */
	providerName: string;
	/** Model name */
	model: string;
	/** Provider version */
	version: string;
	/** Supported capabilities */
	capabilities: string[];
	/** Rate limiting configuration */
	rateLimit: {
		/** Requests per minute */
		requestsPerMinute: number;
		/** Tokens per minute */
		tokensPerMinute: number;
	};
	/** Cost per token */
	costPerToken: number;
	/** Maximum tokens per request */
	maxTokens: number;
	/** Supported languages */
	supportedLanguages: string[];
	/** Last configuration update */
	lastUpdated: Date;
}

/**
 * AI provider status interface
 * @interface AiProviderStatus
 * @description Current status and performance metrics for AI providers
 * @used_by server/src/features/game/logic/providers/implementations (provider implementations)
 */
export interface AiProviderStatus {
	/** Provider name */
	name: string;
	/** Configuration settings */
	config: AiProviderConfig;
	/** Whether provider is available */
	isAvailable: boolean;
	/** Last health check timestamp */
	lastCheck: Date;
	/** Number of errors encountered */
	errorCount: number;
	/** Number of successful requests */
	successCount: number;
	/** Average response time in milliseconds */
	averageResponseTime: number;
	/** Current load percentage */
	currentLoad: number;
}

/**
 * AI provider with trivia generation capability interface
 * @interface AIProviderWithTrivia
 * @description AI provider that can generate trivia questions
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts (provider management)
 */
export interface AIProviderWithTrivia extends TriviaProvider {
	/** Provider status and configuration */
	provider: AiProviderStatus;
	/** Generate question method for LLM interface compatibility */
	generateQuestion(topic: string, difficulty: string, language: string): Promise<LLMTriviaResponse>;
}

/**
 * LLM provider interface
 * @interface LLMProvider
 * @description Base interface for language model providers
 * @used_by server/src/features/game/logic/providers/management/base.provider.ts (BaseTriviaProvider)
 */
export interface LLMProvider extends TriviaProvider {
	/** Generate question method for LLM interface compatibility */
	generateQuestion(topic: string, difficulty: string, language: string): Promise<LLMTriviaResponse>;
}

/**
 * LLM API response interface
 * @interface LLMApiResponse
 * @description Standard response structure from LLM providers
 * @used_by server/src/features/game/logic/providers/implementations (provider implementations)
 */
export interface LLMApiResponse<T = GenericDataValue> {
	/** Response data */
	data: T;
	/** Response status */
	status: number;
	/** Response headers */
	headers?: Record<string, string>;
}

/**
 * LLM trivia response interface
 * @interface LLMTriviaResponse
 * @description Standardized trivia question response from LLM providers
 * @used_by server/src/features/game/logic/providers/implementations (response parsing)
 */
export interface LLMTriviaResponse {
	/** Generated question text */
	question: string;
	/** Answer options */
	answers: string[];
	/** Explanation for the correct answer */
	explanation: string;
	/** Mapped difficulty level (for custom difficulties) */
	mappedDifficulty?: string;
}

/**
 * Provider configuration for API requests
 * @interface ProviderConfig
 * @description Configuration for making API requests to providers
 * @used_by server/src/features/game/logic/providers/management/base.provider.ts (BaseTriviaProvider)
 */
export interface ProviderConfig {
	/** API endpoint URL */
	url: string;
	/** Request headers */
	headers: Record<string, string>;
	/** Request body */
	body: GenericDataValue;
}

/**
 * Prompt parameters interface
 * @interface PromptParams
 * @description Parameters for generating prompts
 * @used_by server/src/features/game/logic/providers/prompts/prompts.ts (PromptTemplates)
 */
export interface PromptParams {
	/** Topic for the question */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Number of answer options */
	answerCount: number;
	/** Whether this is a custom difficulty */
	isCustomDifficulty: boolean;
}

/**
 * Anthropic API response interface
 * @interface AnthropicResponse
 * @description Response structure from Anthropic Claude API
 * @used_by server/src/features/game/logic/providers/implementations/anthropic.provider.ts (AnthropicTriviaProvider)
 */
export interface AnthropicResponse {
	/** Response content array */
	content: Array<{
		/** Text content */
		text: string;
	}>;
	/** Response usage statistics */
	usage: {
		/** Input tokens used */
		input_tokens: number;
		/** Output tokens used */
		output_tokens: number;
	};
}

/**
 * OpenAI API response interface
 * @interface OpenAIResponse
 * @description Response structure from OpenAI API
 * @used_by server/src/features/game/logic/providers/implementations/openai.provider.ts (OpenAITriviaProvider)
 */
export interface OpenAIResponse {
	/** Response choices array */
	choices: Array<{
		/** Message content */
		message: {
			/** Message content */
			content: string;
		};
	}>;
	/** Response usage statistics */
	usage: {
		/** Total tokens used */
		total_tokens: number;
		/** Prompt tokens used */
		prompt_tokens: number;
		/** Completion tokens used */
		completion_tokens: number;
	};
}

/**
 * Google AI API response interface
 * @interface GoogleResponse
 * @description Response structure from Google AI API
 * @used_by server/src/features/game/logic/providers/implementations/google.provider.ts (GoogleTriviaProvider)
 */
export interface GoogleResponse {
	/** Response candidates array */
	candidates: Array<{
		/** Content object */
		content: {
			/** Parts array */
			parts: Array<{
				/** Text content */
				text: string;
			}>;
		};
	}>;
	/** Response usage statistics */
	usageMetadata: {
		/** Total token count */
		totalTokenCount: number;
	};
}

/**
 * Mistral AI API response interface
 * @interface MistralResponse
 * @description Response structure from Mistral AI API
 * @used_by server/src/features/game/logic/providers/implementations/mistral.provider.ts (MistralTriviaProvider)
 */
export interface MistralResponse {
	/** Response choices array */
	choices: Array<{
		/** Message content */
		message: {
			/** Message content */
			content: string;
		};
	}>;
	/** Response usage statistics */
	usage: {
		/** Total tokens used */
		total_tokens: number;
		/** Prompt tokens used */
		prompt_tokens: number;
		/** Completion tokens used */
		completion_tokens: number;
	};
}

/**
 * Queue item interface
 * @interface QueueItem
 * @description Item in the AI request queue
 */
export interface QueueItem {
	/** Item ID */
	id: string;
	/** Request data */
	request: GenericDataValue;
	/** Priority level */
	priority: number;
	/** Topic */
	topic: string;
	/** Creation timestamp */
	created_at: Date;
	/** Processing status */
	status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Queue statistics interface
 * @interface QueueStats
 * @description Statistics for the AI request queue
 */
export interface QueueStats {
	/** Total items in queue */
	totalItems: number;
	/** Items being processed */
	processingItems: number;
	/** Pending items */
	pendingItems: number;
	/** Completed items */
	completedItems: number;
	/** Failed items */
	failedItems: number;
	/** Average wait time in milliseconds */
	averageWaitTime: number;
	/** Average processing time */
	averageProcessingTime: number;
	/** Success rate percentage */
	successRate: number;
	/** Error rate percentage */
	errorRate: number;
}
