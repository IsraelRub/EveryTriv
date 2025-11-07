/**
 * AI-related types for EveryTriv
 *
 * @module AITypes
 * @description Type definitions for AI providers, models, and AI-related functionality
 * @used_by server/src/features/game/logic/providers/implementations
 */
import type { BasicValue } from '../core/data.types';
import type { TriviaQuestion } from './game/trivia.types';

/**
 * LLM trivia response interface
 * @interface LLMTriviaResponse
 * @description Trivia-specific response from LLM providers with enhanced metadata
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface LLMTriviaResponse {
	questions: TriviaQuestion[];
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
 * @description Provider configuration for trivia generation
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	timeout: number;
	maxRetries: number;
	enabled: boolean;
	priority: number;
	headers?: Record<string, string>;
	/**
	 * Request body for API call
	 * @description JSON-serializable object that can contain strings, numbers, booleans, arrays, and nested objects
	 * Different providers have different body structures (OpenAI uses messages array, Google uses contents array, etc.)
	 */
	body?: Record<string, unknown>;
}

/**
 * Provider stats interface
 * @interface ProviderStats
 * @description Provider statistics
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderStats {
	providerName: string;
	requests: number;
	successes: number;
	failures: number;
	averageResponseTime: number;
	successRate: number;
	errorRate: number;
	lastUsed: Date | null;
	status: 'healthy' | 'unhealthy' | 'unavailable' | 'available';
	createdAt: Date;
	updatedAt: Date;
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
	questionCount: number;
	answerCount?: number;
	customInstructions?: string;
	isCustomDifficulty?: boolean;
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
