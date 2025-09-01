/**
 * Shared package index for EveryTriv
 *
 * @module EveryTrivShared
 * @description Central export point for all shared functionality across client and server
 * @version 1.0.0
 * @author EveryTriv Team
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * API constants
 * @description API endpoints, configuration, and HTTP status codes
 * @exports {Object} API endpoints and configuration
 * @used_by client/services, server/controllers
 */
export * from './constants/api.constants';

/**
 * Application constants
 * @description Application-wide constants and configuration settings
 * @exports {Object} App-wide configuration constants
 * @used_by client/components, server/services
 */
export * from './constants';

/**
 * Game constants
 * @description Game mechanics, rules, difficulty levels, and scoring constants
 * @exports {Object} Game-related constants including difficulty levels and scoring
 * @used_by client/game, server/game
 */
export {
	CreditOperation,
	CUSTOM_DIFFICULTY_KEYWORDS,
	CUSTOM_DIFFICULTY_MULTIPLIERS,
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GameMode,
	VALID_CREDIT_OPERATIONS,
	VALID_DIFFICULTIES,
	VALID_GAME_MODES,
	VALID_QUESTION_COUNTS,
} from './constants/game.constants';

/**
 * Logging constants
 * @description Logging configuration, levels, and formatting constants
 * @exports {LogLevel} Logging level enumeration
 * @used_by client/services, server/services
 */
export { LogLevel as LogLevelType } from './constants/logging.constants';

/**
 * Validation constants
 * @description Data validation rules, thresholds, and configuration constants
 * @exports {Object} Validation configuration and threshold constants
 * @used_by client/components, server/middleware
 */
export { VALIDATION_DEBOUNCE_DELAYS, VALIDATION_HOOK_CONFIG } from './constants/validation.constants';

// ============================================================================
// SERVICES
// ============================================================================

/**
 * Shared services
 * @description Core services shared between client and server including storage and logging
 * @exports {Object} Storage and logging service implementations
 * @used_by client/services, server/services
 */
export * from './services/storage';

// ============================================================================
// TYPES
// ============================================================================

/**
 * API types
 * @description API request/response types and interfaces
 * @exports {Object} API-related type definitions
 * @used_by client/services, server/controllers
 */
export * from './types/api.types';

/**
 * Analytics types
 * @description Analytics, metrics, and performance tracking types
 * @exports {Object} Analytics and metrics type definitions
 * @used_by client/analytics, server/analytics
 */
export type {
	AnalyticsInsights,
	PerformanceMetrics,
	QuestionCacheEntry,
	QuestionStats,
	// CacheStats is exported from cache.types.ts to avoid conflicts
} from './types/analytics.types';

/**
 * AI types
 * @description AI and machine learning related types and interfaces
 * @exports {Object} AI-related type definitions
 * @used_by client/ai, server/ai
 */
export * from './types/ai.types';

/**
 * Game types
 * @description Game-related types, interfaces, and data structures
 * @exports {Object} Game-related type definitions
 * @used_by client/game, server/game
 */
export * from './types/game.types';

/**
 * Payment types
 * @description Payment processing, billing, and transaction types
 * @exports {Object} Payment-related type definitions
 * @used_by client/payment, server/payment
 */
export * from './types/payment.types';

/**
 * User types
 * @description User-related types, profiles, and authentication interfaces
 * @exports {Object} User-related type definitions
 * @used_by client/user, server/user
 */
export * from './types/user.types';

/**
 * Validation types
 * @description Validation-related types, interfaces, and result structures
 * @exports {Object} Validation-related type definitions
 * @used_by client/validation, server/validation
 */
export type {
	AsyncValidationFunction,
	BaseValidationResult,
	FieldValidationResult,
	FormValidationResult,
	PasswordStrength,
	PasswordValidationResult,
	RealTimeValidationOptions,
	ValidationContext,
	ValidationError,
	ValidationErrorCategory,
	ValidationFunction,
	ValidationHookOptions,
	ValidationHookResult,
	ValidationIconProps,
	ValidationMessageProps,
	ValidationRule,
	ValidationSchema,
	ValidationStatus,
	ValidationStatusIndicatorProps,
	ValidationType,
} from './types/validation.types';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation hooks and utilities
 * @description React hooks and utility functions for form validation
 * @exports {Function} Validation hooks and utility functions
 * @used_by client/components, client/forms
 */
export { useLanguageValidation, useValidation } from './hooks/useValidation';

/**
 * Core validation functions
 * @description Main validation functions for various data types
 * @exports {Function} Core validation utility functions
 * @used_by client/components, server/middleware
 */
export {
	validateCustomDifficultyText,
	validateEmail,
	validateInputContent,
	validateInputWithLanguageTool,
	validatePassword,
	validateTopicLength,
	validateUsername,
} from './validation';

/**
 * Validation schemas
 * @description Validation schema definitions and utilities
 * @exports {Function} Schema validation utilities
 * @used_by client/validation, server/validation
 */
export type { SchemaName } from './validation/schemas';
export { getAvailableSchemaNames, getValidationSchema, isValidSchemaName } from './validation/schemas';

/**
 * Language validation constants
 * @description Language detection and validation constants
 * @exports {Object} Language validation configuration constants
 * @used_by client/validation, server/validation
 */
export {
	COMMON_MISSPELLINGS,
	GRAMMAR_PATTERNS,
	LANGUAGE_DETECTION,
	LANGUAGE_TOOL_CONSTANTS,
} from './constants/language.constants';

/**
 * Validation thresholds
 * @description Validation threshold constants and configuration
 * @exports {Object} Validation threshold constants
 * @used_by client/validation, server/validation
 */
export { VALIDATION_THRESHOLDS } from './constants/validation.constants';

/**
 * Language validation types
 * @description Language validation related types and interfaces
 * @exports {Object} Language validation type definitions
 * @used_by client/validation, server/validation
 */
export type {
	LanguageToolConfig,
	LanguageToolError,
	LanguageToolResponse,
	LanguageValidationOptions,
	SupportedLanguage,
} from './types/language.types';

// ============================================================================
// UTILS
// ============================================================================

/**
 * Data utilities
 * @description Data manipulation, transformation, and formatting utilities
 * @exports {Function} Data processing utility functions
 * @used_by client/utils, server/utils
 */
export * from './utils/data.utils';

/**
 * Format utilities
 * @description Text formatting, display, and presentation utilities
 * @exports {Function} Text formatting utility functions
 * @used_by client/components, server/services
 */
export * from './utils/format.utils';

/**
 * ID utilities
 * @description ID generation, validation, and manipulation utilities
 * @exports {Function} ID-related utility functions
 * @used_by client/utils, server/services
 */
export * from './utils/id.utils';

/**
 * Sanitization utilities
 * @description Input sanitization, cleaning, and security utilities
 * @exports {Function} Input sanitization utility functions
 * @used_by client/utils, server/middleware
 */
export * from './utils/sanitization.utils';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Difficulty validation
 * @description Custom difficulty validation and processing utilities
 * @exports {Function} Difficulty validation utility functions
 * @used_by client/utils, server/services
 */
export * from './validation/difficulty.validation';

/**
 * Payment validation
 * @description Payment processing and transaction validation utilities
 * @exports {Function} Payment validation utility functions
 * @used_by client/payment, server/payment
 */
export * from './validation/payment.validation';

/**
 * Trivia validation
 * @description Trivia game content and rules validation utilities
 * @exports {Function} Trivia validation utility functions
 * @used_by client/game, server/game
 */
export * from './validation/trivia.validation';
