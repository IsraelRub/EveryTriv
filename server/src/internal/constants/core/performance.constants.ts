/**
 * Server Core Performance Constants
 * @module ServerCorePerformanceConstants
 * @description Server-side performance constants
 */

export const RATE_LIMITS = {
	GENERAL: { limit: 100, window: 60 }, // 100 requests per minute
	ADMIN_SAFE: { limit: 20, window: 60 }, // 20 requests per minute
	ADMIN_DANGEROUS: { limit: 2, window: 60 }, // 2 requests per minute
	STORAGE_READ: { limit: 20, window: 60 }, // 20 requests per minute
	STORAGE_WRITE: { limit: 10, window: 60 }, // 10 requests per minute
	STORAGE_DELETE: { limit: 2, window: 60 }, // 2 requests per minute
	CACHE_STATS: { limit: 20, window: 60 }, // 20 requests per minute
	CACHE_CLEAR: { limit: 2, window: 60 }, // 2 requests per minute
	METRICS_READ: { limit: 20, window: 60 }, // 20 requests per minute
	METRICS_RESET: { limit: 5, window: 60 }, // 5 requests per minute
} as const;
