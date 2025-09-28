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
 * @used_by server/src/features/game/logic/providers/implementations
 */

/**
 * AI provider configuration interface
 * @interface AIProviderConfig
 * @description Configuration for AI providers
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
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
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIValidationResponse extends AIResponse {
	validationResult: {
		isValid: boolean;
		overallScore: number;
		details: Array<{
			issueType: string;
			description: string;
			severity: 'low' | 'medium' | 'high' | 'critical';
			position?: {
				start: number;
				end: number;
			};
			suggestedFix?: string;
			confidenceScore: number;
		}>;
		suggestions: string[];
		warnings: string[];
		statistics: {
			totalIssues: number;
			criticalIssues: number;
			highSeverityIssues: number;
			mediumSeverityIssues: number;
			lowSeverityIssues: number;
		};
	};
}

/**
 * AI analysis request interface
 * @interface AIAnalysisRequest
 * @description Request for text analysis
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIAnalysisRequest extends AIRequest {
	text: string;
	analysisType: 'sentiment' | 'emotion' | 'intent' | 'topic' | 'keyword' | 'summary' | 'complexity';
	language?: string;
	context?: string;
	options?: {
		includeConfidenceScores?: boolean;
		includeAlternatives?: boolean;
		includeDetailedBreakdown?: boolean;
		includeVisualizations?: boolean;
	};
}

/**
 * AI analysis response interface
 * @interface AIAnalysisResponse
 * @description Response for text analysis
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIAnalysisResponse extends AIResponse {
	analysisResult: {
		analysisType: string;
		primaryResult: string;
		confidenceScore: number;
		detailedBreakdown?: Record<string, BasicValue>;
		alternativeResults?: Array<{
			result: string;
			confidenceScore: number;
			reasoning?: string;
		}>;
		keywords?: string[];
		topics?: string[];
		entities?: Array<{
			name: string;
			type: string;
			confidence: number;
			position?: {
				start: number;
				end: number;
			};
		}>;
		sentiment?: {
			overall: 'positive' | 'negative' | 'neutral';
			score: number;
			emotions: Record<string, number>;
		};
		complexity?: {
			readabilityScore: number;
			complexityLevel: 'low' | 'medium' | 'high';
			vocabularyComplexity: number;
			sentenceComplexity: number;
		};
	};
}

/**
 * AI translation request interface
 * @interface AITranslationRequest
 * @description Request for text translation
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AITranslationRequest extends AIRequest {
	text: string;
	sourceLanguage: string;
	targetLanguage: string;
	context?: string;
	options?: {
		preserveFormatting?: boolean;
		includeAlternatives?: boolean;
		includeConfidenceScores?: boolean;
		includeCulturalAdaptation?: boolean;
	};
}

/**
 * AI translation response interface
 * @interface AITranslationResponse
 * @description Response for text translation
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AITranslationResponse extends AIResponse {
	translationResult: {
		translatedText: string;
		sourceLanguage: string;
		targetLanguage: string;
		confidenceScore: number;
		alternativeTranslations?: Array<{
			translation: string;
			confidenceScore: number;
			style?: string;
		}>;
		culturalAdaptations?: Array<{
			originalPhrase: string;
			adaptedPhrase: string;
			reason: string;
		}>;
		notes?: string[];
		qualityIndicators: {
			fluencyScore: number;
			accuracyScore: number;
			culturalAppropriatenessScore: number;
		};
	};
}

/**
 * AI summary request interface
 * @interface AISummaryRequest
 * @description Request for text summarization
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AISummaryRequest extends AIRequest {
	text: string;
	summaryLength: 'short' | 'medium' | 'long';
	summaryType?: 'extractive' | 'abstractive' | 'hybrid';
	language?: string;
	context?: string;
	options?: {
		includeKeyPoints?: boolean;
		includeStatistics?: boolean;
		includeConclusions?: boolean;
		includeRecommendations?: boolean;
		includeQuotes?: boolean;
	};
}

/**
 * AI summary response interface
 * @interface AISummaryResponse
 * @description Response for text summarization
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AISummaryResponse extends AIResponse {
	summaryResult: {
		summary: string;
		summaryLength: string;
		summaryType: string;
		compressionRatio: number;
		keyPoints?: string[];
		statistics?: Record<string, BasicValue>;
		conclusions?: string[];
		recommendations?: string[];
		importantQuotes?: Array<{
			quote: string;
			importance: number;
			position?: {
				start: number;
				end: number;
			};
		}>;
		qualityMetrics: {
			coherenceScore: number;
			relevanceScore: number;
			completenessScore: number;
			readabilityScore: number;
		};
	};
}

/**
 * AI entity request interface
 * @interface AIEntityRequest
 * @description Request for entity extraction
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIEntityRequest extends AIRequest {
	text: string;
	entityTypes?: string[];
	language?: string;
	context?: string;
	options?: {
		includeConfidenceScores?: boolean;
		includeEntityRelationships?: boolean;
		includeEntityAttributes?: boolean;
		includeEntityCategories?: boolean;
	};
}

/**
 * AI entity response interface
 * @interface AIEntityResponse
 * @description Response for entity extraction
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIEntityResponse extends AIResponse {
	entityResult: {
		entities: Array<{
			name: string;
			type: string;
			category?: string;
			confidence: number;
			position: {
				start: number;
				end: number;
			};
			attributes?: Record<string, BasicValue>;
			relationships?: Array<{
				relatedEntity: string;
				relationshipType: string;
				confidence: number;
			}>;
		}>;
		statistics: {
			totalEntities: number;
			entityTypeDistribution: Record<string, number>;
			entityCategoryDistribution: Record<string, number>;
			averageConfidenceScore: number;
		};
		relationships?: Array<{
			sourceEntity: string;
			targetEntity: string;
			relationshipType: string;
			confidence: number;
		}>;
	};
}

/**
 * AI classification request interface
 * @interface AIClassificationRequest
 * @description Request for text classification
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIClassificationRequest extends AIRequest {
	text: string;
	categories: string[];
	language?: string;
	context?: string;
	options?: {
		includeConfidenceScores?: boolean;
		includeAlternatives?: boolean;
		includeReasoning?: boolean;
		includeFeatures?: boolean;
	};
}

/**
 * AI classification response interface
 * @interface AIClassificationResponse
 * @description Response for text classification
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIClassificationResponse extends AIResponse {
	classificationResult: {
		primaryClassification: {
			category: string;
			confidenceScore: number;
			reasoning?: string;
		};
		alternativeClassifications?: Array<{
			category: string;
			confidenceScore: number;
			reasoning?: string;
		}>;
		features?: Array<{
			name: string;
			value: number;
			importance: number;
		}>;
		statistics: {
			totalCategories: number;
			categoryDistribution: Record<string, number>;
			averageConfidenceScore: number;
			classificationCertainty: number;
		};
	};
}

/**
 * AI embedding request interface
 * @interface AIEmbeddingRequest
 * @description Request for embedding generation
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIEmbeddingRequest extends AIRequest {
	text: string;
	embeddingModel?: string;
	language?: string;
	context?: string;
	options?: {
		normalizeEmbeddings?: boolean;
		includeMetadata?: boolean;
		includeSimilarityScores?: boolean;
	};
}

/**
 * AI embedding response interface
 * @interface AIEmbeddingResponse
 * @description Response for embedding generation
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIEmbeddingResponse extends AIResponse {
	embeddingResult: {
		embedding: number[];
		dimension: number;
		model: string;
		metadata?: {
			textLength: number;
			tokenCount: number;
			language?: string;
			qualityScore?: number;
		};
		similarityScores?: Array<{
			referenceText: string;
			similarityScore: number;
		}>;
	};
}

/**
 * AI chat request interface
 * @interface AIChatRequest
 * @description Request for chat completion
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIChatRequest extends AIRequest {
	messages: Array<{
		role: 'system' | 'user' | 'assistant';
		content: string;
		timestamp?: Date;
		metadata?: Record<string, BasicValue>;
	}>;
	options?: {
		maxTokens?: number;
		temperature?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		stopSequences?: string[];
		includeFunctionCalls?: boolean;
		includeToolCalls?: boolean;
	};
}

/**
 * AI chat response interface
 * @interface AIChatResponse
 * @description Response for chat completion
 * @used_by server/src/features/game/logic/providers/implementations
 */
export interface AIChatResponse extends AIResponse {
	chatResult: {
		message: {
			role: 'assistant';
			content: string;
			timestamp: Date;
			metadata?: Record<string, BasicValue>;
		};
		tokenUsage: {
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
		};
		finishReason: string;
		functionCalls?: Array<{
			name: string;
			arguments: Record<string, BasicValue>;
		}>;
		toolCalls?: Array<{
			name: string;
			arguments: Record<string, BasicValue>;
		}>;
		qualityMetrics: {
			relevanceScore: number;
			coherenceScore: number;
			helpfulnessScore: number;
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
	content: string;
	metadata?: Record<string, BasicValue>;
	status: 'success' | 'error';
	error?: string;
}

/**
 * LLM trivia response interface
 * @interface LLMTriviaResponse
 * @description Trivia-specific response from LLM providers
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
	};
}

/**
 * Provider configuration interface
 * @interface ProviderConfig
 * @description Generic provider configuration
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
}

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Provider health status
 * @used_by server/src/features/game/logic/providers/management/providers.service.ts
 */
export interface ProviderHealth {
	providerName: string;
	status: 'healthy' | 'unhealthy';
	responseTime: number;
	errorCount: number;
	successCount: number;
	lastCheck: string;
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
 * Anthropic response interface
 * @interface AnthropicResponse
 * @description Response from Anthropic API
 * @used_by server/src/features/game/logic/providers/implementations/anthropic.provider.ts
 */
export interface AnthropicResponse extends LLMApiResponse {
	anthropicMetadata?: {
		model: string;
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
	googleMetadata?: {
		model: string;
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
	mistralMetadata?: {
		model: string;
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
	openaiMetadata?: {
		model: string;
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
	topic: string;
	difficulty: string;
	questionCount: number;
	answerCount?: number;
	language?: string;
	customInstructions?: string;
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
	providerName: string;
	status: 'healthy' | 'unhealthy' | 'unknown';
	lastCheck: Date;
	responseTime?: number;
	errorCount: number;
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
