/**
 * AI Providers types for EveryTriv
 *
 * @module AIProvidersTypes
 * @description Type definitions for AI providers and their configurations
 */

/**
 * AI provider configuration interface (extended)
 * @interface AIProviderConfigExtended
 * @description Extended configuration for AI providers
 */
export interface AIProviderConfigExtended {
	name: string;
	apiKey: string;
	endpoint: string;
	version: string;
	model: string;
	timeout: number;
	retry: {
		maxRetries: number;
		retryDelay: number;
		retryBackoff: number;
	};
	rateLimit: {
		requestsPerMinute: number;
		tokensPerMinute: number;
		parallelRequests: number;
	};
	cache: {
		enabled: boolean;
		ttl: number;
		size: number;
	};
	monitoring: {
		metricsEnabled: boolean;
		loggingEnabled: boolean;
		healthChecksEnabled: boolean;
	};
}

/**
 * AI provider health interface (extended)
 * @interface AIProviderHealthExtended
 * @description Extended health status for AI providers
 */
export interface AIProviderHealthExtended {
	providerName: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	responseTime?: number;
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
}

/**
 * AI provider metrics interface (extended)
 * @interface AIProviderMetricsExtended
 * @description Extended metrics for AI providers
 */
export interface AIProviderMetricsExtended {
	providerName: string;
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	averageResponseTime: number;
	successRate: number;
	errorRate: number;
	lastUsed?: string;
	status: 'available' | 'unavailable' | 'error';
}

/**
 * AI provider capabilities interface (extended)
 * @interface AIProviderCapabilitiesExtended
 * @description Extended capabilities of AI providers
 */
export interface AIProviderCapabilitiesExtended {
	textGeneration: boolean;
	questionGeneration: boolean;
	textValidation: boolean;
	textAnalysis: boolean;
	textTranslation: boolean;
	textSummarization: boolean;
	entityExtraction: boolean;
	textClassification: boolean;
	embeddingGeneration: boolean;
	chatCompletion: boolean;
	imageGeneration: boolean;
	codeGeneration: boolean;
	mathematicalReasoning: boolean;
	logicalReasoning: boolean;
	creativeWriting: boolean;
	technicalWriting: boolean;
	multilingualSupport: boolean;
	contextLength: number;
	maxTokens: number;
	supportedLanguages: string[];
	supportedFormats: string[];
}
