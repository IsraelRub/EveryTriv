/**
 * Server Types Index
 *
 * @module ServerTypes
 * @description Central export file for all server-side TypeScript types and interfaces
 * @version 1.0.0
 * @author EveryTriv Team
 */

/**
 * Configuration types
 * @description Application configuration, database, JWT, and rate limiting types
 * @exports {Object} Configuration-related type definitions
 */
export type { AppConfig, DatabaseConfig, JwtConfig, RateLimitConfig } from './config.types';

/**
 * NestJS types
 * @description NestJS framework specific types and interfaces
 * @exports {Object} NestJS-related type definitions
 */
export type {
	AuthenticatedRequest,
	CookieData,
	NestNextFunction,
	NestRequest,
	NestResponse,
	RequestContext,
} from './nest.types';

/**
 * Redis types
 * @description Redis cache, client, and configuration types
 * @exports {Object} Redis-related type definitions
 */
export type { RedisCacheEntry, RedisClient, RedisConfig, RedisLogger, RedisStats } from './redis.types';

/**
 * Trivia types
 * @description Trivia game, questions, and response types
 * @exports {Object} Trivia-related type definitions
 */
export type { CreateTriviaRequest, ServerTriviaQuestion, TriviaData, TriviaResponse } from './trivia.types';

/**
 * Payment types
 * @description Payment processing, subscriptions, and webhook metadata types
 * @exports {Object} Payment-related type definitions
 */
export type { PaymentMetadata, SubscriptionMetadata, WebhookMetadata } from './payment.types';

/**
 * User types
 * @description User metadata and profile types
 * @exports {Object} User-related type definitions
 */
export type { UserMetadata } from './user.types';

/**
 * Shared types
 * @description Comprehensive set of shared types for AI, analytics, auth, cache, and more
 * @exports {Object} Shared type definitions
 */
export type {
	// AI types
	AiProviderConfig,
	AiProviderStatus,
	AIProviderWithTrivia,
	// Game types
	AnalyticsAnswerData,
	// Analytics types
	CacheStats as AnalyticsCacheStats,
	AnalyticsInsights,
	AnswerResult,
	AnthropicResponse,
	// API types
	ApiError,
	ApiMetadata,
	ApiResponse,
	// Auth types
	AuthCredentials,
	AuthRequest,
	AuthResponse,
	AuthState,
	// Cache types
	CachedQuestionDto,
	CacheHealthStatus,
	CacheInvalidationDto,
	CacheQuestionsQueryDto,
	CacheQuestionsResponseDto,
	CacheStats,
	CompleteProfileData,
	ConfirmPointPurchaseDto,
	CreateGameHistoryData,
	CreateGameHistoryDto,
	CreateSubscriptionDto,
	DeductCreditsDto,
	DeductPointsDto,
	DifficultyStats,
	ErrorResponse,
	GameHistoryEntry,
	GameHistoryRequest,
	GameModeConfig,
	GameStats,
	GoogleResponse,
	HttpStatusCode,
	JWTPayload,
	// User types
	LeaderboardEntry,
	LLMApiResponse,
	LLMProvider,
	LLMTriviaResponse,
	MistralResponse,
	OpenAIResponse,
	PaginatedResponse,
	PerformanceMetrics,
	// Points types
	PointBalance,
	PointPurchaseOption,
	PointTransaction,
	PromptParams,
	ProviderConfig,
	ProviderStats,
	PurchasePackageDto,
	PurchasePointsDto,
	QuestionAnalytics,
	QuestionCacheEntry,
	QuestionCount,
	QueueItem,
	QueueStats,
	QuizHistoryData,
	SavedQuizHistory,
	SecurityMetrics,
	SystemInsights,
	SystemStats,
	TopicAnalytics,
	TransferResult,
	TriviaAnswer,
	TriviaHistoryRequest,
	TriviaQuestion,
	TriviaRequest,
	UpdateProfileData,
	UpdateUserProfileData,
	User,
	UserAddress,
	UserAnalytics,
	UserProfile,
	UserProgressData,
	UserRankData,
	UserScoreData,
	UserStats,
	UserStatsData,
} from 'everytriv-shared/types';

/**
 * Subscription types
 * @description Subscription plans, data, and user subscription types
 * @exports {Object} Subscription-related type definitions
 */
export type {
	SubscriptionData,
	SubscriptionPlanDetails,
	SubscriptionPlans,
	UserEntitySubscription,
	UserStatsWithSubscription,
} from 'everytriv-shared/types';

/**
 * Validation schema types
 * @description Validation schema names and configuration types
 * @exports {Object} Validation schema type definitions
 */
export type { SchemaName } from 'everytriv-shared/validation/schemas';

/**
 * Validation types
 * @description Validation interfaces, contexts, and result data structures
 * @exports {Object} Validation-related type definitions
 * @used_by server/src/common/validation
 */
export type {
	ValidationContext,
	ValidationError,
	ValidationOptions,
	ValidationResult,
	ValidationRule,
} from './validation.types';

/**
 * Validation middleware configuration
 * @description Validation middleware configuration types for backward compatibility
 * @exports {Object} Validation middleware configuration types
 */
export type { ValidationMiddlewareConfig as ValidationConfig } from 'everytriv-shared/types';
