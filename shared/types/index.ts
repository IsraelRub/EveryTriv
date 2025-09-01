/**
 * Shared Types Index
 *
 * @module SharedTypes
 * @description Central export point for all shared TypeScript types and interfaces
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/src/types, server/src/shared/types
 */

/**
 * Core type definitions
 * @description Fundamental type definitions used across the application
 * @exports {Object} Core type definitions
 */
export * from './ai.types';
export * from './api.types';
export * from './auth.types';
export * from './data.types';
export * from './error.types';
export * from './game.types';
export * from './http.types';
export * from './logging.types';
export * from './metadata.types';
export * from './payment.types';
export * from './points.types';
export * from './response.types';
export * from './storage.types';
export * from './subscription.types';
export * from './typeorm.types';
export * from './ui.types';
export * from './user.types';

/**
 * Cache types
 * @description Cache management, storage, and invalidation type definitions
 * @exports {Object} Cache-related type definitions
 */
export type {
	CachedQuestionDto,
	CacheHealthStatus,
	CacheInvalidationDto,
	CacheQuestionsQueryDto,
	CacheQuestionsResponseDto,
	CacheStorage,
	QuestionCacheMap,
	UserProgressData,
} from './cache.types';

/**
 * Component types
 * @description React component prop and state type definitions
 * @exports {Object} Component-related type definitions
 */
export type { ErrorBoundaryProps, ErrorBoundaryState } from './component.types';

/**
 * Validation types
 * @description Form validation, field validation, and validation result types
 * @exports {Object} Validation-related type definitions
 */
export type {
	AsyncValidationFunction,
	BaseFormValidationResult,
	BaseValidationResult,
	FieldValidationResult,
	FormValidationResult,
	PasswordValidationResult,
	RealTimeValidationOptions,
	RequestDataType,
	StringFormValidationResult,
	ValidationContext,
	ValidationError,
	ValidationFunction,
	ValidationHookOptions,
	ValidationHookResult,
	ValidationIconProps,
	ValidationInterceptorOptions,
	ValidationInterceptorResult,
	ValidationMiddlewareConfig,
	ValidationOptions,
	ValidationResult,
	ValidationRule,
	ValidationSchema,
	ValidationStatus,
	ValidationStatusIndicatorProps,
	ValidationType,
} from './validation.types';

/**
 * Analytics types
 * @description Analytics, metrics, and performance tracking type definitions
 * @exports {Object} Analytics-related type definitions
 */
export type {
	AnalyticsEventData,
	AnalyticsInsights,
	AnalyticsMetadata,
	AnalyticsResponse,
	PerformanceMetrics,
	ProviderHealth,
	ProviderMetrics,
	QuestionAnalytics,
	QuestionCacheEntry,
	SecurityMetrics,
	SystemInsights,
	SystemStats,
	TopicAnalytics,
	UserAnalytics,
	UserAnalyticsQuery,
	UserAnalyticsStats,
} from './analytics.types';

/**
 * Logging types
 * @description Logging system, log entries, and logger interface types
 * @exports {Object} Logging-related type definitions
 */
export type {
	ClientLogEntry,
	ClientLogsRequest,
	EnhancedLogEntry,
	HttpLogData,
	HttpLogger,
	Logger as ILogger,
	LogContext,
	LogEntry,
} from './logging.types';

/**
 * Storage types
 * @description Storage configuration, operations, and service interface types
 * @exports {Object} Storage-related type definitions
 */
export type {
	StorageCleanupOptions as StorageCleanupOptionsType,
	StorageConfig,
	StorageOperationResult,
	StorageStats,
	UnifiedStorageService,
} from './storage.types';

/**
 * Language validation types
 * @description Language detection, validation, and tool integration types
 * @exports {Object} Language validation type definitions
 */
export type {
	LanguageToolConfig,
	LanguageToolError,
	LanguageToolResponse,
	LanguageValidationOptions,
	LanguageValidationResult,
	SupportedLanguage,
} from './language.types';
