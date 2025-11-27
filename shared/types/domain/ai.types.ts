/**
 * AI-related types for EveryTriv
 *
 * @module AITypes
 * @description Type definitions for AI providers, models, and AI-related functionality
 * @used_by server/src/features/game/logic/providers/implementations
 */
import type { BaseTimestamps, BasicValue } from '../core/data.types';

/**
 * LLM question format (simplified, without topic/difficulty which are added later)
 * @interface LLMQuestion
 * @description Question format returned by LLM providers
 */
export interface LLMQuestion {
	question: string;
	answers: string[];
	correctAnswerIndex: number;
}

/**
 * LLM trivia response interface
 * @interface LLMTriviaResponse
 * @description Trivia-specific response from LLM providers with enhanced metadata
 * Uses LLMQuestion (with answers: string[]) instead of TriviaQuestion (with answers: TriviaAnswer[])
 * because LLM providers return simple string arrays for answers
 * Topic and difficulty are added later in base.provider.ts
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface LLMTriviaResponse {
	questions: LLMQuestion[];
	explanation?: string;
	content: string;
	status: 'success' | 'error';
	metadata?: {
		provider: string;
		responseTime: number;
		tokenCount?: number;
		qualityScore?: number;
		confidenceScore?: number;
		warnings?: string[];
	};
}

/**
 * Provider configuration interface
 * @interface ProviderConfig
 * @description Provider configuration for trivia generation.
 * Priority determines selection order (lower number = higher priority, selected first).
 * Providers are prioritized by cost: free providers (priority 1) are selected before paid ones.
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	timeout: number;
	maxRetries: number;
	enabled: boolean;
	/** Priority level (1 = highest priority, selected first). Lower number = higher priority */
	priority: number;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
}

/**
 * Provider stats interface
 * @interface ProviderStats
 * @description Provider statistics
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderStats extends BaseTimestamps {
	providerName: string;
	requests: number;
	successes: number;
	failures: number;
	averageResponseTime: number;
	successRate: number;
	errorRate: number;
	lastUsed: Date | null;
	status: 'healthy' | 'unhealthy' | 'unavailable' | 'available';
}

/**
 * Prompt parameters interface
 * @interface PromptParams
 * @description Parameters for prompt generation with enhanced options
 * @used_by server/src/features/game/logic/prompts/prompts.ts
 */
export interface PromptParams {
	topic: string;
	difficulty: string;
	answerCount: number;
	customInstructions?: string;
	isCustomDifficulty?: boolean;
	excludeQuestions?: string[];
	options?: {
		includeExplanation?: boolean;
		includeHints?: boolean;
		includeReferences?: boolean;
		qualityCheck?: boolean;
	};
}

/**
 * LLM Response Parsing interface
 * @interface LLMResponse
 * @description Response parsing for different LLM providers
 * @used_by server/src/features/game/logic/providers/implementations
 */
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

/**
 * AI Provider Instance interface
 * @interface AIProviderInstance
 * @description Provider instance for trivia generation
 */
export interface AIProviderInstance {
	name: string;
	config: {
		providerName: string;
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
