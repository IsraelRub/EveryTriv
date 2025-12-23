/**
 * AI Types (server-only)
 * AI provider and LLM type definitions
 */
import { DifficultyLevel, ProviderStatus as ProviderStatusEnum } from '@shared/constants';
import type { BaseTimestamps, BaseTriviaConfig, BasicValue, TriviaQuestion } from '@shared/types';

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
 */
export interface LLMTriviaResponse {
	questions: LLMQuestion[];
	explanation?: string;
	content: string;
	status: 'success' | 'error';
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

/**
 * Raw LLM JSON payload that providers must emit
 */
export interface TriviaLLMJsonPayload {
	question: string;
	answers: string[];
}

/**
 * Provider configuration interface
 * @interface ProviderConfig
 * @description Provider configuration for trivia generation
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
}

/**
 * Provider stats interface
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
	status: (typeof ProviderStatusEnum)[keyof typeof ProviderStatusEnum];
}

/**
 * Prompt parameters interface
 * Extends BaseTriviaParams with AI-specific parameters
 */
export interface PromptParams extends BaseTriviaConfig {
	answerCount: number; // Required for AI generation
	isCustomDifficulty?: boolean;
	mappedDifficulty?: DifficultyLevel; // Normalized difficulty level (set by pipe)
}

/**
 * LLM Response Parsing interface
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
 * Provider trivia generation result
 */
export interface ProviderTriviaGenerationResult {
	question: TriviaQuestion;
	mappedDifficulty?: DifficultyLevel;
}

/**
 * AI Provider Instance interface
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
