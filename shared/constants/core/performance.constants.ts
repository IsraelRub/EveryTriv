/**
 * Performance Constants for EveryTriv
 *
 * @module PerformanceConstants
 * @description Cache durations, rate limits, and performance thresholds
 * @author EveryTriv Team
 * @used_by server/src/features, server/src/internal/modules
 */

/**
 * Cache duration constants (in seconds)
 * @constant
 * @description Standard cache durations for different types of data
 */
export const CACHE_DURATION = {
	// Standard cache durations
	VERY_SHORT: 30, // 30 seconds
	SHORT: 60, // 1 minute
	MEDIUM: 300, // 5 minutes
	LONG: 600, // 10 minutes
	EXTENDED: 900, // 15 minutes
	VERY_LONG: 3600, // 1 hour
	EXTREME: 86400, // 1 day

	// Specific use cases
	SEARCH_RESULTS: 300, // 5 minutes
	USER_PROFILE: 600, // 10 minutes
	ADMIN_STATS: 300, // 5 minutes
	METRICS: 300, // 5 minutes
	STORAGE_METRICS: 30, // 30 seconds
} as const;

/**
 * Rate limiting constants
 * @constant
 * @description Rate limits for different types of operations
 */
export const RATE_LIMITS = {
	// General API limits
	GENERAL: { limit: 100, window: 60 }, // 100 requests per minute

	// Admin operations (more restrictive)
	ADMIN_SAFE: { limit: 20, window: 60 }, // 20 requests per minute
	ADMIN_DANGEROUS: { limit: 2, window: 60 }, // 2 requests per minute

	// Storage operations
	STORAGE_READ: { limit: 20, window: 60 }, // 20 requests per minute
	STORAGE_WRITE: { limit: 10, window: 60 }, // 10 requests per minute
	STORAGE_DELETE: { limit: 2, window: 60 }, // 2 requests per minute

	// Cache operations
	CACHE_STATS: { limit: 20, window: 60 }, // 20 requests per minute
	CACHE_CLEAR: { limit: 2, window: 60 }, // 2 requests per minute

	// Metrics operations
	METRICS_READ: { limit: 20, window: 60 }, // 20 requests per minute
	METRICS_RESET: { limit: 5, window: 60 }, // 5 requests per minute
} as const;

/**
 * Performance threshold constants (in milliseconds)
 * @constant
 * @description Performance thresholds for monitoring and alerts
 */
export const PERFORMANCE_THRESHOLDS = {
	// Response time thresholds
	FAST: 100, // 100ms - considered fast
	ACCEPTABLE: 500, // 500ms - acceptable response time
	SLOW: 1000, // 1s - slow response time
	VERY_SLOW: 3000, // 3s - very slow response time

	// Database operation thresholds
	DB_FAST: 50, // 50ms - fast DB operation
	DB_ACCEPTABLE: 200, // 200ms - acceptable DB operation
	DB_SLOW: 1000, // 1s - slow DB operation

	// Cache operation thresholds
	CACHE_FAST: 10, // 10ms - fast cache operation
	CACHE_ACCEPTABLE: 50, // 50ms - acceptable cache operation
} as const;

/**
 * Default pagination limits
 * @constant
 * @description Default limits for pagination and search results
 */
export const PAGINATION_LIMITS = {
	DEFAULT: 10, // Default page size
	SMALL: 5, // Small page size
	MEDIUM: 20, // Medium page size
	LARGE: 50, // Large page size
	MAX: 100, // Maximum page size
} as const;

/**
 * String truncation limits
 * @constant
 * @description Limits for string truncation in logs and responses
 */
export const STRING_LIMITS = {
	SHORT: 50, // Short string limit (for logs)
	MEDIUM: 100, // Medium string limit
	LONG: 500, // Long string limit
	MAX_LOG: 1000, // Maximum log string length
} as const;

/**
 * Performance operation status enumeration
 * @enum PerformanceOperationStatus
 * @description Status of performance operations
 */
export enum PerformanceOperationStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	ERROR = 'error',
}
