/**
 * Shared package index for EveryTriv
 *
 * @module EveryTrivShared
 * @description Central export point for all shared functionality across client and server
 * @author EveryTriv Team
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All shared constants (excluding types to avoid conflicts)
 * @description Complete set of all shared constants
 * @exports {Object} All shared constants
 * @used_by client/services, server/controllers
 */
export {
	AI_PROVIDER_ERROR_TYPES,
	// Analytics Constants
	ANALYTICS_ERROR_MESSAGES,
	// API Constants
	API_ENDPOINTS,
	API_VERSION,
	APP_DESCRIPTION,
	APP_NAME,
	// Auth Constants
	AUTH_CONSTANTS,
	AuthHeader,
	CACHE_TTL,
	CONTACT_INFO,
	COOKIE_NAMES,
	COUNTRIES,
	CUSTOM_DIFFICULTY_KEYWORDS,
	CUSTOM_DIFFICULTY_MULTIPLIERS,
	CUSTOM_DIFFICULTY_PREFIX,
	// Infrastructure Constants
	DEFAULT_PORTS,
	DEFAULT_URLS,
	DIFFICULTY_MULTIPLIERS,
	DifficultyLevel,
	ERROR_CONTEXT_MESSAGES,
	FALLBACK_QUESTION_ANSWERS,
	FALLBACK_QUESTION_METADATA,
	GAME_ERROR_MESSAGES,
	// Game Constants
	GameMode,
	HTTP_ERROR_CODES,
	HTTP_ERROR_MESSAGES,
	HTTP_LOG_MESSAGES,
	HTTP_STATUS_CODES,
	// Language Constants
	LANGUAGE_TOOL_CONSTANTS,
	// Logging Constants
	LogLevel,
	// Navigation Constants
	NAVIGATION_LINKS,
	PAYMENT_CONTENT,
	PAYMENT_ERROR_MESSAGES,
	// Payment Constants
	PAYMENT_FEATURES,
	POINTS_PRICING_TIERS,
	POPULAR_TOPICS,
	// Provider Constants
	PROVIDER_ERROR_MESSAGES,
	RATE_LIMIT_DEFAULTS,
	SERVER_GAME_CONSTANTS,
	// Social Constants
	SHARE_PLATFORMS,
	SOCIAL_LINKS,
	// Storage Constants
	STORAGE_KEYS,
	TokenType,
	UI_THEME_VARIANTS,
	// Info Constants
	UserRole,
	UserStatus,
	VALID_DIFFICULTIES,
	VALID_GAME_MODES,
	VALID_QUESTION_COUNTS,
	VALIDATION_DEBOUNCE_DELAYS,
	// Validation Constants
	VALIDATION_ERROR_MESSAGES,
	VALIDATION_LIMITS,
	ValidationErrorCategory,
} from './constants';

// ============================================================================
// SERVICES
// ============================================================================

/**
 * All shared services
 * @description Complete set of all shared services including storage and logging
 * @exports {Object} All shared services
 * @used_by client/services, server/services
 */
export * from './services';

// ============================================================================
// TYPES
// ============================================================================

/**
 * All shared types
 * @description Complete set of all shared type definitions
 * @exports {Object} All shared types
 * @used_by client/services, server/controllers
 */
export * from './types';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * All validation utilities and hooks
 * @description Complete set of all validation functions, hooks, and schemas
 * @exports {Function} All validation utilities
 * @used_by client/components, client/forms, server/middleware
 */

export * from './validation';

// ============================================================================
// UTILS
// ============================================================================

/**
 * All shared utilities (excluding functions already exported from types)
 * @description Complete set of all shared utility functions
 * @exports {Function} All shared utility functions
 * @used_by client/utils, server/utils
 */
export * from './utils';
