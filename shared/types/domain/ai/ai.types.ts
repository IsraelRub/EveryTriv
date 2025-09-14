/**
 * AI-related types for EveryTriv
 *
 * @module AITypes
 * @description Type definitions for AI providers, models, and AI-related functionality
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts, client/src/services/ai/ai.service.ts
 */
import type { BasicValue } from '../../core/data.types';
import type { TriviaQuestion } from '../game/trivia.types';

/**
 * AI provider types
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'local';

/**
 * AI model types
 */
export type AIModel =
	| 'gpt-3.5-turbo'
	| 'gpt-4'
	| 'gpt-4-turbo'
	| 'claude-3-sonnet'
	| 'claude-3-opus'
	| 'gemini-pro'
	| 'gemini-pro-vision';

/**
 * AI request status types
 */
export type AIRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * AI response status types
 */
export type AIResponseStatus = 'success' | 'error' | 'partial' | 'timeout';

/**
 * AI provider interface
 * @interface AIProvider
 * @description Interface for AI providers
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */

/**
 * AI provider configuration interface
 * @interface AIProviderConfig
 * @description Configuration for AI providers
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIProviderConfig {
	name: AIProvider;
	apiKey: string;
	endpoint: string;
	version: string;
	model: AIModel;
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
 * AI provider health interface
 * @interface AIProviderHealth
 * @description Health status for AI providers
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIProviderHealth {
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
 * AI provider capabilities interface
 * @interface AIProviderCapabilities
 * @description Capabilities of AI providers
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIProviderCapabilities {
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

/**
 * AI request interface
 * @interface AIRequest
 * @description Base interface for AI requests
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIRequest {
	requestId: string;
	provider: AIProvider;
	model: AIModel;
	timestamp: Date;
	timeout?: number;
	metadata?: Record<string, BasicValue>;
}

/**
 * AI response interface
 * @interface AIResponse
 * @description Base interface for AI responses
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIResponse {
	responseId: string;
	requestId: string;
	provider: AIProvider;
	model: AIModel;
	status: AIResponseStatus;
	timestamp: Date;
	processingTime: number;
	metadata?: Record<string, BasicValue>;
	error?: {
		code: string;
		message: string;
		details?: Record<string, BasicValue>;
	};
}

/**
 * AI text request interface
 * @interface AITextRequest
 * @description Request for text generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AITextRequest extends AIRequest {
	prompt: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	stopSequences?: string[];
	systemMessage?: string;
	userMessage?: string;
	context?: string;
	language?: string;
	style?: string;
	tone?: string;
	length?: 'short' | 'medium' | 'long';
	format?: 'text' | 'markdown' | 'html' | 'json' | 'xml';
}

/**
 * AI text response interface
 * @interface AITextResponse
 * @description Response for text generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AITextResponse extends AIResponse {
	text: string;
	tokenUsage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	finishReason: string;
	qualityScore?: number;
	confidenceScore?: number;
	alternatives?: string[];
	suggestions?: string[];
	warnings?: string[];
}

/**
 * AI question request interface
 * @interface AIQuestionRequest
 * @description Request for question generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIQuestionRequest extends AIRequest {
	topic: string;
	difficulty: string;
	count: number;
	type?: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay';
	language?: string;
	context?: string;
	requirements?: {
		minLength?: number;
		maxLength?: number;
		includeExplanation?: boolean;
		includeHints?: boolean;
		includeReferences?: boolean;
	};
}

/**
 * AI question response interface
 * @interface AIQuestionResponse
 * @description Response for question generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIQuestionResponse extends AIResponse {
	questions: Array<{
		id: string;
		question: string;
		answers: string[];
		correctAnswerIndex: number;
		explanation?: string;
		hints?: string[];
		references?: string[];
		difficulty: string;
		topic: string;
		category?: string;
		tags?: string[];
		qualityScore?: number;
		complexityScore?: number;
	}>;
	totalQuestions: number;
	generationMetadata: {
		averageQualityScore: number;
		averageComplexityScore: number;
		topicCoverage: Record<string, number>;
		difficultyDistribution: Record<string, number>;
		categoryDistribution: Record<string, number>;
	};
}

/**
 * AI validation request interface
 * @interface AIValidationRequest
 * @description Request for text validation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIValidationRequest extends AIRequest {
	text: string;
	validationType: 'grammar' | 'spelling' | 'style' | 'factual' | 'logical' | 'completeness';
	language?: string;
	context?: string;
	criteria?: {
		grammarRules?: string[];
		styleGuidelines?: string[];
		factualAccuracy?: boolean;
		logicalConsistency?: boolean;
		completenessCheck?: boolean;
	};
}

/**
 * AI validation response interface
 * @interface AIValidationResponse
 * @description Response for text validation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIValidationResponse extends AIResponse {
	/** Validation result */
	validationResult: {
		/** Is valid */
		isValid: boolean;
		/** Overall score */
		overallScore: number;
		/** Validation details */
		details: Array<{
			/** Issue type */
			issueType: string;
			/** Issue description */
			description: string;
			/** Issue severity */
			severity: 'low' | 'medium' | 'high' | 'critical';
			/** Issue position */
			position?: {
				start: number;
				end: number;
			};
			/** Suggested fix */
			suggestedFix?: string;
			/** Confidence score */
			confidenceScore: number;
		}>;
		/** Suggestions */
		suggestions: string[];
		/** Warnings */
		warnings: string[];
		/** Statistics */
		statistics: {
			/** Total issues */
			totalIssues: number;
			/** Critical issues */
			criticalIssues: number;
			/** High severity issues */
			highSeverityIssues: number;
			/** Medium severity issues */
			mediumSeverityIssues: number;
			/** Low severity issues */
			lowSeverityIssues: number;
		};
	};
}

/**
 * AI analysis request interface
 * @interface AIAnalysisRequest
 * @description Request for text analysis
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIAnalysisRequest extends AIRequest {
	/** Text to analyze */
	text: string;
	/** Analysis type */
	analysisType: 'sentiment' | 'emotion' | 'intent' | 'topic' | 'keyword' | 'summary' | 'complexity';
	/** Language */
	language?: string;
	/** Context */
	context?: string;
	/** Analysis options */
	options?: {
		/** Include confidence scores */
		includeConfidenceScores?: boolean;
		/** Include alternative analyses */
		includeAlternatives?: boolean;
		/** Include detailed breakdown */
		includeDetailedBreakdown?: boolean;
		/** Include visualizations */
		includeVisualizations?: boolean;
	};
}

/**
 * AI analysis response interface
 * @interface AIAnalysisResponse
 * @description Response for text analysis
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIAnalysisResponse extends AIResponse {
	/** Analysis result */
	analysisResult: {
		/** Analysis type */
		analysisType: string;
		/** Primary result */
		primaryResult: string;
		/** Confidence score */
		confidenceScore: number;
		/** Detailed breakdown */
		detailedBreakdown?: Record<string, BasicValue>;
		/** Alternative results */
		alternativeResults?: Array<{
			/** Alternative result */
			result: string;
			/** Confidence score */
			confidenceScore: number;
			/** Reasoning */
			reasoning?: string;
		}>;
		/** Keywords */
		keywords?: string[];
		/** Topics */
		topics?: string[];
		/** Entities */
		entities?: Array<{
			/** Entity name */
			name: string;
			/** Entity type */
			type: string;
			/** Entity confidence */
			confidence: number;
			/** Entity position */
			position?: {
				start: number;
				end: number;
			};
		}>;
		/** Sentiment analysis */
		sentiment?: {
			/** Overall sentiment */
			overall: 'positive' | 'negative' | 'neutral';
			/** Sentiment score */
			score: number;
			/** Emotion breakdown */
			emotions: Record<string, number>;
		};
		/** Complexity analysis */
		complexity?: {
			/** Readability score */
			readabilityScore: number;
			/** Complexity level */
			complexityLevel: 'low' | 'medium' | 'high';
			/** Vocabulary complexity */
			vocabularyComplexity: number;
			/** Sentence complexity */
			sentenceComplexity: number;
		};
	};
}

/**
 * AI translation request interface
 * @interface AITranslationRequest
 * @description Request for text translation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AITranslationRequest extends AIRequest {
	/** Text to translate */
	text: string;
	/** Source language */
	sourceLanguage: string;
	/** Target language */
	targetLanguage: string;
	/** Translation context */
	context?: string;
	/** Translation options */
	options?: {
		/** Preserve formatting */
		preserveFormatting?: boolean;
		/** Include alternatives */
		includeAlternatives?: boolean;
		/** Include confidence scores */
		includeConfidenceScores?: boolean;
		/** Include cultural adaptation */
		includeCulturalAdaptation?: boolean;
	};
}

/**
 * AI translation response interface
 * @interface AITranslationResponse
 * @description Response for text translation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AITranslationResponse extends AIResponse {
	/** Translation result */
	translationResult: {
		/** Translated text */
		translatedText: string;
		/** Source language */
		sourceLanguage: string;
		/** Target language */
		targetLanguage: string;
		/** Confidence score */
		confidenceScore: number;
		/** Alternative translations */
		alternativeTranslations?: Array<{
			/** Alternative translation */
			translation: string;
			/** Confidence score */
			confidenceScore: number;
			/** Translation style */
			style?: string;
		}>;
		/** Cultural adaptations */
		culturalAdaptations?: Array<{
			/** Original phrase */
			originalPhrase: string;
			/** Adapted phrase */
			adaptedPhrase: string;
			/** Adaptation reason */
			reason: string;
		}>;
		/** Translation notes */
		notes?: string[];
		/** Quality indicators */
		qualityIndicators: {
			/** Fluency score */
			fluencyScore: number;
			/** Accuracy score */
			accuracyScore: number;
			/** Cultural appropriateness score */
			culturalAppropriatenessScore: number;
		};
	};
}

/**
 * AI summary request interface
 * @interface AISummaryRequest
 * @description Request for text summarization
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AISummaryRequest extends AIRequest {
	/** Text to summarize */
	text: string;
	/** Summary length */
	summaryLength: 'short' | 'medium' | 'long';
	/** Summary type */
	summaryType?: 'extractive' | 'abstractive' | 'hybrid';
	/** Language */
	language?: string;
	/** Context */
	context?: string;
	/** Summary options */
	options?: {
		/** Include key points */
		includeKeyPoints?: boolean;
		/** Include statistics */
		includeStatistics?: boolean;
		/** Include conclusions */
		includeConclusions?: boolean;
		/** Include recommendations */
		includeRecommendations?: boolean;
		/** Include quotes */
		includeQuotes?: boolean;
	};
}

/**
 * AI summary response interface
 * @interface AISummaryResponse
 * @description Response for text summarization
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AISummaryResponse extends AIResponse {
	/** Summary result */
	summaryResult: {
		/** Summary text */
		summary: string;
		/** Summary length */
		summaryLength: string;
		/** Summary type */
		summaryType: string;
		/** Compression ratio */
		compressionRatio: number;
		/** Key points */
		keyPoints?: string[];
		/** Statistics */
		statistics?: Record<string, BasicValue>;
		/** Conclusions */
		conclusions?: string[];
		/** Recommendations */
		recommendations?: string[];
		/** Important quotes */
		importantQuotes?: Array<{
			/** Quote text */
			quote: string;
			/** Quote importance */
			importance: number;
			/** Quote position */
			position?: {
				start: number;
				end: number;
			};
		}>;
		/** Quality metrics */
		qualityMetrics: {
			/** Coherence score */
			coherenceScore: number;
			/** Relevance score */
			relevanceScore: number;
			/** Completeness score */
			completenessScore: number;
			/** Readability score */
			readabilityScore: number;
		};
	};
}

/**
 * AI entity request interface
 * @interface AIEntityRequest
 * @description Request for entity extraction
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIEntityRequest extends AIRequest {
	/** Text to analyze */
	text: string;
	/** Entity types */
	entityTypes?: string[];
	/** Language */
	language?: string;
	/** Context */
	context?: string;
	/** Extraction options */
	options?: {
		/** Include confidence scores */
		includeConfidenceScores?: boolean;
		/** Include entity relationships */
		includeEntityRelationships?: boolean;
		/** Include entity attributes */
		includeEntityAttributes?: boolean;
		/** Include entity categories */
		includeEntityCategories?: boolean;
	};
}

/**
 * AI entity response interface
 * @interface AIEntityResponse
 * @description Response for entity extraction
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIEntityResponse extends AIResponse {
	/** Entity extraction result */
	entityResult: {
		/** Extracted entities */
		entities: Array<{
			/** Entity name */
			name: string;
			/** Entity type */
			type: string;
			/** Entity category */
			category?: string;
			/** Entity confidence */
			confidence: number;
			/** Entity position */
			position: {
				start: number;
				end: number;
			};
			/** Entity attributes */
			attributes?: Record<string, BasicValue>;
			/** Entity relationships */
			relationships?: Array<{
				/** Related entity */
				relatedEntity: string;
				/** Relationship type */
				relationshipType: string;
				/** Relationship confidence */
				confidence: number;
			}>;
		}>;
		/** Entity statistics */
		statistics: {
			/** Total entities */
			totalEntities: number;
			/** Entity type distribution */
			entityTypeDistribution: Record<string, number>;
			/** Entity category distribution */
			entityCategoryDistribution: Record<string, number>;
			/** Average confidence score */
			averageConfidenceScore: number;
		};
		/** Entity relationships */
		relationships?: Array<{
			/** Source entity */
			sourceEntity: string;
			/** Target entity */
			targetEntity: string;
			/** Relationship type */
			relationshipType: string;
			/** Relationship confidence */
			confidence: number;
		}>;
	};
}

/**
 * AI classification request interface
 * @interface AIClassificationRequest
 * @description Request for text classification
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIClassificationRequest extends AIRequest {
	/** Text to classify */
	text: string;
	/** Classification categories */
	categories: string[];
	/** Language */
	language?: string;
	/** Context */
	context?: string;
	/** Classification options */
	options?: {
		/** Include confidence scores */
		includeConfidenceScores?: boolean;
		/** Include alternative classifications */
		includeAlternatives?: boolean;
		/** Include classification reasoning */
		includeReasoning?: boolean;
		/** Include classification features */
		includeFeatures?: boolean;
	};
}

/**
 * AI classification response interface
 * @interface AIClassificationResponse
 * @description Response for text classification
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIClassificationResponse extends AIResponse {
	/** Classification result */
	classificationResult: {
		/** Primary classification */
		primaryClassification: {
			/** Category */
			category: string;
			/** Confidence score */
			confidenceScore: number;
			/** Reasoning */
			reasoning?: string;
		};
		/** Alternative classifications */
		alternativeClassifications?: Array<{
			/** Category */
			category: string;
			/** Confidence score */
			confidenceScore: number;
			/** Reasoning */
			reasoning?: string;
		}>;
		/** Classification features */
		features?: Array<{
			/** Feature name */
			name: string;
			/** Feature value */
			value: number;
			/** Feature importance */
			importance: number;
		}>;
		/** Classification statistics */
		statistics: {
			/** Total categories */
			totalCategories: number;
			/** Category distribution */
			categoryDistribution: Record<string, number>;
			/** Average confidence score */
			averageConfidenceScore: number;
			/** Classification certainty */
			classificationCertainty: number;
		};
	};
}

/**
 * AI embedding request interface
 * @interface AIEmbeddingRequest
 * @description Request for embedding generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIEmbeddingRequest extends AIRequest {
	/** Text to embed */
	text: string;
	/** Embedding model */
	embeddingModel?: string;
	/** Language */
	language?: string;
	/** Context */
	context?: string;
	/** Embedding options */
	options?: {
		/** Normalize embeddings */
		normalizeEmbeddings?: boolean;
		/** Include metadata */
		includeMetadata?: boolean;
		/** Include similarity scores */
		includeSimilarityScores?: boolean;
	};
}

/**
 * AI embedding response interface
 * @interface AIEmbeddingResponse
 * @description Response for embedding generation
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIEmbeddingResponse extends AIResponse {
	/** Embedding result */
	embeddingResult: {
		/** Embedding vector */
		embedding: number[];
		/** Embedding dimension */
		dimension: number;
		/** Embedding model */
		model: string;
		/** Embedding metadata */
		metadata?: {
			/** Text length */
			textLength: number;
			/** Token count */
			tokenCount: number;
			/** Language */
			language?: string;
			/** Quality score */
			qualityScore?: number;
		};
		/** Similarity scores */
		similarityScores?: Array<{
			/** Reference text */
			referenceText: string;
			/** Similarity score */
			similarityScore: number;
		}>;
	};
}

/**
 * AI chat request interface
 * @interface AIChatRequest
 * @description Request for chat completion
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIChatRequest extends AIRequest {
	/** Chat messages */
	messages: Array<{
		/** Message role */
		role: 'system' | 'user' | 'assistant';
		/** Message content */
		content: string;
		/** Message timestamp */
		timestamp?: Date;
		/** Message metadata */
		metadata?: Record<string, BasicValue>;
	}>;
	/** Chat options */
	options?: {
		/** Maximum tokens */
		maxTokens?: number;
		/** Temperature */
		temperature?: number;
		/** Top P */
		topP?: number;
		/** Frequency penalty */
		frequencyPenalty?: number;
		/** Presence penalty */
		presencePenalty?: number;
		/** Stop sequences */
		stopSequences?: string[];
		/** Include function calls */
		includeFunctionCalls?: boolean;
		/** Include tool calls */
		includeToolCalls?: boolean;
	};
}

/**
 * AI chat response interface
 * @interface AIChatResponse
 * @description Response for chat completion
 * @used_by server/src/features/ai/providers/ai.provider.ts, server/src/features/ai/services/ai.service.ts
 */
export interface AIChatResponse extends AIResponse {
	/** Chat result */
	chatResult: {
		/** Assistant message */
		message: {
			/** Message role */
			role: 'assistant';
			/** Message content */
			content: string;
			/** Message timestamp */
			timestamp: Date;
			/** Message metadata */
			metadata?: Record<string, BasicValue>;
		};
		/** Token usage */
		tokenUsage: {
			/** Prompt tokens */
			promptTokens: number;
			/** Completion tokens */
			completionTokens: number;
			/** Total tokens */
			totalTokens: number;
		};
		/** Finish reason */
		finishReason: string;
		/** Function calls */
		functionCalls?: Array<{
			/** Function name */
			name: string;
			/** Function arguments */
			arguments: Record<string, BasicValue>;
		}>;
		/** Tool calls */
		toolCalls?: Array<{
			/** Tool name */
			name: string;
			/** Tool arguments */
			arguments: Record<string, BasicValue>;
		}>;
		/** Quality metrics */
		qualityMetrics: {
			/** Relevance score */
			relevanceScore: number;
			/** Coherence score */
			coherenceScore: number;
			/** Helpfulness score */
			helpfulnessScore: number;
			/** Safety score */
			safetyScore: number;
		};
	};
}

/**
 * LLM API response interface
 * @interface LLMApiResponse
 * @description Standard response from LLM providers
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface LLMApiResponse {
	/** Response content */
	content: string;
	/** Response metadata */
	metadata?: Record<string, BasicValue>;
	/** Response status */
	status: 'success' | 'error';
	/** Error message if any */
	error?: string;
}

/**
 * LLM trivia response interface
 * @interface LLMTriviaResponse
 * @description Trivia-specific response from LLM providers
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface LLMTriviaResponse {
	/** Trivia questions */
	questions: TriviaQuestion[];
	/** Explanation */
	explanation?: string;
	/** Response content */
	content: string;
	/** Response status */
	status: 'success' | 'error';
	/** Response metadata */
	metadata?: {
		/** Provider used */
		provider: string;
		/** Response time */
		responseTime: number;
		/** Token count */
		tokenCount?: number;
	};
}

/**
 * Provider configuration interface
 * @interface ProviderConfig
 * @description Generic provider configuration
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface ProviderConfig {
	/** Provider name */
	name: string;
	/** API key */
	apiKey: string;
	/** Base URL */
	baseUrl: string;
	/** Timeout in milliseconds */
	timeout: number;
	/** Maximum retries */
	maxRetries: number;
	/** Whether provider is enabled */
	enabled: boolean;
	/** Provider priority */
	priority: number;
	/** Headers */
	headers?: Record<string, string>;
	/** Body */
	body?: Record<string, any>;
}

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Provider health status
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderHealth {
	/** Provider name */
	providerName: string;
	/** Status */
	status: 'healthy' | 'unhealthy';
	/** Response time */
	responseTime: number;
	/** Error count */
	errorCount: number;
	/** Success count */
	successCount: number;
	/** Last check */
	lastCheck: string;
	/** Created at */
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
	/** Success rate */
	successRate: number;
	/** Error rate */
	errorRate: number;
	/** Last used */
	lastUsed: Date | string;
	status: 'healthy' | 'unhealthy' | 'unavailable' | 'available';
	created_at: Date;
	updated_at: Date;
}

/**
 * LLM provider interface
 * @interface LLMProvider
 * @description Generic LLM provider interface
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface LLMProvider {
	name: string;
	config: ProviderConfig;
	health: ProviderHealth;
	metrics: ProviderMetrics;
	capabilities: AIProviderCapabilities;
}

/**
 * Provider stats interface
 * @interface ProviderStats
 * @description Provider statistics
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderStats {
	/** Provider name */
	providerName: string;
	/** Total requests */
	requests: number;
	/** Successful requests */
	successes: number;
	/** Failed requests */
	failures: number;
	/** Average response time */
	averageResponseTime: number;
	/** Success rate */
	successRate: number;
	/** Error rate */
	errorRate: number;
	/** Last used timestamp */
	lastUsed: Date | null;
	/** Provider status */
	status: 'healthy' | 'unhealthy' | 'unavailable' | 'available';
	/** Created at */
	created_at: Date;
	updated_at: Date;
}


/**
 * Anthropic response interface
 * @interface AnthropicResponse
 * @description Response from Anthropic API
 * @used_by server/src/features/game/logic/providers/implementations/anthropic.provider.ts
 */
export interface AnthropicResponse extends LLMApiResponse {
	/** Anthropic-specific metadata */
	anthropicMetadata?: {
		/** Model used */
		model: string;
		/** Usage statistics */
		usage?: {
			inputTokens: number;
			outputTokens: number;
		};
	};
}

/**
 * Google response interface
 * @interface GoogleResponse
 * @description Response from Google AI API
 * @used_by server/src/features/game/logic/providers/implementations/google.provider.ts
 */
export interface GoogleResponse extends LLMApiResponse {
	/** Google-specific metadata */
	googleMetadata?: {
		/** Model used */
		model: string;
		/** Usage statistics */
		usage?: {
			inputTokens: number;
			outputTokens: number;
		};
	};
}

/**
 * Mistral response interface
 * @interface MistralResponse
 * @description Response from Mistral AI API
 * @used_by server/src/features/game/logic/providers/implementations/mistral.provider.ts
 */
export interface MistralResponse extends LLMApiResponse {
	/** Mistral-specific metadata */
	mistralMetadata?: {
		/** Model used */
		model: string;
		/** Usage statistics */
		usage?: {
			inputTokens: number;
			outputTokens: number;
		};
	};
}

/**
 * OpenAI response interface
 * @interface OpenAIResponse
 * @description Response from OpenAI API
 * @used_by server/src/features/game/logic/providers/implementations/openai.provider.ts
 */
export interface OpenAIResponse extends LLMApiResponse {
	/** OpenAI-specific metadata */
	openaiMetadata?: {
		/** Model used */
		model: string;
		/** Usage statistics */
		usage?: {
			inputTokens: number;
			outputTokens: number;
		};
	};
}

/**
 * Prompt parameters interface
 * @interface PromptParams
 * @description Parameters for prompt generation
 * @used_by server/src/features/game/logic/prompts/prompts.ts
 */
export interface PromptParams {
	/** Topic */
	topic: string;
	/** Difficulty */
	difficulty: string;
	/** Question count */
	questionCount: number;
	/** Answer count */
	answerCount?: number;
	/** Language */
	language?: string;
	/** Custom instructions */
	customInstructions?: string;
	/** Is custom difficulty */
	isCustomDifficulty?: boolean;
}

/**
 * AI provider config interface (alias)
 * @interface AiProviderConfig
 * @description Alias for AIProviderConfig
 * @used_by server/src/internal/types/index.ts
 */
export type AiProviderConfig = AIProviderConfig;

/**
 * AI provider status interface
 * @interface AiProviderStatus
 * @description AI provider status
 * @used_by server/src/internal/types/index.ts
 */
export interface AiProviderStatus {
	/** Provider name */
	providerName: string;
	/** Status */
	status: 'healthy' | 'unhealthy' | 'unknown';
	/** Last check */
	lastCheck: Date;
	/** Response time */
	responseTime?: number;
	/** Error count */
	errorCount: number;
	/** Success count */
	successCount: number;
}

/**
 * Round to decimals function
 * @function roundToDecimals
 * @description Round a number to specified decimal places
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */

// LLM Provider Interface
export interface LLMProvider {
	name: string;
	type: string;
	isActive: boolean;
	priority: number;
	config: ProviderConfig;
}

// LLM Response Parsing
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
