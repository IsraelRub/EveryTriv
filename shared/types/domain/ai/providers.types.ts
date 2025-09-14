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
	/** Provider name */
	name: string;
	/** API key */
	apiKey: string;
	/** API endpoint */
	endpoint: string;
	/** API version */
	version: string;
	/** Model configuration */
	model: string;
	/** Request timeout */
	timeout: number;
	/** Retry configuration */
	retry: {
		/** Maximum retries */
		maxRetries: number;
		/** Retry delay */
		retryDelay: number;
		/** Retry backoff */
		retryBackoff: number;
	};
	/** Rate limiting */
	rateLimit: {
		/** Requests per minute */
		requestsPerMinute: number;
		/** Tokens per minute */
		tokensPerMinute: number;
		parallelRequests: number;
	};
	/** Caching configuration */
	cache: {
		/** Cache enabled */
		enabled: boolean;
		/** Cache TTL */
		ttl: number;
		/** Cache size */
		size: number;
	};
	/** Monitoring configuration */
	monitoring: {
		/** Metrics enabled */
		metricsEnabled: boolean;
		/** Logging enabled */
		loggingEnabled: boolean;
		/** Health checks enabled */
		healthChecksEnabled: boolean;
	};
}


/**
 * AI provider health interface (extended)
 * @interface AIProviderHealthExtended
 * @description Extended health status for AI providers
 */
export interface AIProviderHealthExtended {
	/** Provider name */
	providerName: string;
	/** Health status */
	status: 'healthy' | 'unhealthy' | 'degraded';
	/** Response time in milliseconds */
	responseTime?: number;
	/** Error count */
	errorCount: number;
	/** Success count */
	successCount: number;
	/** Last health check */
	lastCheck: string;
	/** Error message if unhealthy */
	errorMessage?: string;
	/** Provider configuration */
	config?: {
		/** Model */
		model?: string;
		/** Version */
		version?: string;
		/** Rate limit */
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
	/** Provider name */
	providerName: string;
	/** Total requests */
	totalRequests: number;
	/** Successful requests */
	successfulRequests: number;
	/** Failed requests */
	failedRequests: number;
	/** Average response time */
	averageResponseTime: number;
	/** Success rate percentage */
	successRate: number;
	/** Error rate percentage */
	errorRate: number;
	/** Last used timestamp */
	lastUsed?: string;
	/** Status */
	status: 'available' | 'unavailable' | 'error';
}


/**
 * AI provider capabilities interface (extended)
 * @interface AIProviderCapabilitiesExtended
 * @description Extended capabilities of AI providers
 */
export interface AIProviderCapabilitiesExtended {
	/** Text generation */
	textGeneration: boolean;
	/** Question generation */
	questionGeneration: boolean;
	/** Text validation */
	textValidation: boolean;
	/** Text analysis */
	textAnalysis: boolean;
	/** Text translation */
	textTranslation: boolean;
	/** Text summarization */
	textSummarization: boolean;
	/** Entity extraction */
	entityExtraction: boolean;
	/** Text classification */
	textClassification: boolean;
	/** Embedding generation */
	embeddingGeneration: boolean;
	/** Chat completion */
	chatCompletion: boolean;
	/** Image generation */
	imageGeneration: boolean;
	/** Code generation */
	codeGeneration: boolean;
	/** Mathematical reasoning */
	mathematicalReasoning: boolean;
	/** Logical reasoning */
	logicalReasoning: boolean;
	/** Creative writing */
	creativeWriting: boolean;
	/** Technical writing */
	technicalWriting: boolean;
	/** Multilingual support */
	multilingualSupport: boolean;
	/** Context length */
	contextLength: number;
	/** Maximum tokens */
	maxTokens: number;
	/** Supported languages */
	supportedLanguages: string[];
	/** Supported formats */
	supportedFormats: string[];
}
