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
	// API Constants
	API_ENDPOINTS,
	API_VERSION,
	HTTP_STATUS_CODES,
	COOKIE_NAMES,
	RATE_LIMIT_DEFAULTS,
	
	// Auth Constants
	AUTH_CONSTANTS,
	TokenType,
	AuthHeader,
	
	// Game Constants
	GameMode,
	CUSTOM_DIFFICULTY_PREFIX,
	CUSTOM_DIFFICULTY_KEYWORDS,
	DifficultyLevel,
	DIFFICULTY_MULTIPLIERS,
	CUSTOM_DIFFICULTY_MULTIPLIERS,
	VALID_DIFFICULTIES,
	VALID_QUESTION_COUNTS,
	VALID_GAME_MODES,
	VALIDATION_LIMITS,
	GAME_ERROR_MESSAGES,
	SERVER_GAME_CONSTANTS,
	
	// Info Constants
	UserRole,
	UserStatus,
	CONTACT_INFO,
	POPULAR_TOPICS,
	APP_NAME,
	APP_DESCRIPTION,
	COUNTRIES,
	
	// Infrastructure Constants
	DEFAULT_PORTS,
	DEFAULT_URLS,
	
	// Language Constants
	LANGUAGE_TOOL_CONSTANTS,
	
	// Logging Constants
	LogLevel,
	HTTP_LOG_MESSAGES,
	HTTP_ERROR_CODES,
	HTTP_ERROR_MESSAGES,
	
	// Navigation Constants
	NAVIGATION_LINKS,
	
	// Social Constants
	SHARE_PLATFORMS,
	SOCIAL_LINKS,
	
	// Payment Constants
	PAYMENT_FEATURES,
	PAYMENT_CONTENT,
	PAYMENT_ERROR_MESSAGES,
	POINTS_PRICING_TIERS,
	
	// Provider Constants
	PROVIDER_ERROR_MESSAGES,
	AI_PROVIDER_ERROR_TYPES,
	ERROR_CONTEXT_MESSAGES,
	FALLBACK_QUESTION_ANSWERS,
	FALLBACK_QUESTION_METADATA,
	
	// Analytics Constants
	ANALYTICS_ERROR_MESSAGES,
	
	// Storage Constants
	STORAGE_KEYS,
	CACHE_TTL,
	
	// Validation Constants
	VALIDATION_ERROR_MESSAGES,
	ValidationErrorCategory,
	VALIDATION_DEBOUNCE_DELAYS,
	UI_THEME_VARIANTS
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
