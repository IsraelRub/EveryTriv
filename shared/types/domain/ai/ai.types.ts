/**
 * AI-related types for EveryTriv
 *
 * @module AITypes
 * @description Type definitions for AI providers, models, and AI-related functionality
 * @used_by server/src/features/game/logic/providers/implementations
 */
import type { BasicValue } from '../../core/data.types';
import type { TriviaQuestion } from '../game/trivia.types';

/**
 * Unavailable provider interface
 * @interface UnavailableProvider
 * @description Common structure for unavailable AI providers
 */
export interface UnavailableProvider {
	name: string;
	reason: string;
	lastChecked: string;
}

/**
 * Provider issue interface
 * @interface ProviderIssue
 * @description Common structure for provider issues
 */
export interface ProviderIssue {
	provider: string;
	issue: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * LLM API response interface
 * @interface LLMApiResponse
 * @description Standard response from LLM providers
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface LLMApiResponse {
	content: string;
	metadata?: Record<string, BasicValue>;
	status: 'success' | 'error';
	error?: string;
}

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
 * @description Enhanced provider configuration with retry and rate limiting
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
	body?: Record<string, unknown>;
	retry?: {
		maxRetries: number;
		retryDelay: number;
		retryBackoff: number;
	};
	rateLimit?: {
		requestsPerMinute: number;
		tokensPerMinute: number;
		parallelRequests: number;
	};
}

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Provider health status with enhanced monitoring
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderHealth {
	providerName: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	responseTime: number;
	errorCount: number;
	successCount: number;
	lastCheck: string;
	errorMessage?: string;
	config?: {
		model?: string;
		version?: string;
		rateLimit?: {
			requestsPerMinute: number;
			tokensPerMinute: number;
		};
	};
	created_at: Date;
	updated_at: Date;
}

/**
 * Provider metrics interface
 * @interface ProviderMetrics
 * @description Provider metrics
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderMetrics {
	providerName: string;
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	averageResponseTime: number;
	successRate: number;
	errorRate: number;
	lastUsed: Date | string;
	status: 'healthy' | 'unhealthy' | 'unavailable' | 'available';
	created_at: Date;
	updated_at: Date;
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
	created_at: Date;
	updated_at: Date;
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
	language?: string;
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
		content?: Array<{ text: string }>;
		candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
		choices?: Array<{ message: { content: string } }>;
	};
	metadata?: Record<string, BasicValue>;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}
