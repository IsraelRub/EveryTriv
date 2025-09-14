/**
 * Shared Types Index
 *
 * @module SharedTypes
 * @description Central export point for all shared TypeScript types and interfaces
 * @author EveryTriv Team
 * @used_by client/src/types, server/src/shared/types
 */

/**
 * Base type definitions
 * @description Fundamental type definitions used across the application
 * @exports {Object} Base type definitions
 */
// Base types are distributed to specific files

/**
 * Core type definitions
 * @description Core type definitions used across the application
 * @exports {Object} Core type definitions
 */
// Core types
export * from './core';
// Domain types
export * from './domain';
// Infrastructure types
export * from './infrastructure';
// Payment types
export * from './payment.types';
// Single file types
export * from './language.types';
export * from './points.types';
export * from './subscription.types';
export * from './ui.types';

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
	CacheStats,
	CacheStorage,
	QuestionCacheMap,
	UserProgressData,
} from './infrastructure/cache.types';

/**
 * Component types
 * @description React component prop and state type definitions
 * @exports {Object} Component-related type definitions
 */
// Component types moved to ui.types

/**
 * Validation types
 * @description Form validation, field validation, and validation result types
 * @exports {Object} Validation-related type definitions
 */
export type {
	AsyncValidationFunction,
	BaseValidationResult,
	CustomDifficultyValidationResponse,
	DifficultyValidation,
	FieldValidationResult,
	PasswordValidationResult,
	PaymentValidationResult,
	PointsValidationResult,
	RequestDataType,
	SharedTriviaInputValidation,
	ValidateCustomDifficultyRequest,
	ValidationContext,
	ValidationDecoratorOptions,
	ValidationError,
	ValidationFunction,
	ValidationInterceptorOptions,
	ValidationInterceptorResult,
	ValidationMiddlewareConfig,
	ValidationOptions,
	ValidationResult,
	ValidationRule,
	ValidationStatus,
	ValidationType,
} from './domain/validation/validation.types';

/**
 * Analytics types
 * @description Analytics, metrics, and performance tracking type definitions
 * @exports {Object} Analytics-related type definitions
 */
export type {
	AnalyticsEventData,
	AnalyticsMetadata,
	AnalyticsResponse,
	DifficultyStats,
	DifficultyStatsData,
	GameAnalyticsQuery,
	GameStatsData,
	QuestionAnalytics,
	SystemStats,
	TopicAnalytics,
	TopicStatsData,
	UserAnalytics,
	UserAnalyticsQuery,
	UserAnalyticsStats,
} from './domain/analytics/analytics.types';

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
} from './infrastructure/logging.types';

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
	StorageService as StorageService,
} from './infrastructure/storage.types';

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
