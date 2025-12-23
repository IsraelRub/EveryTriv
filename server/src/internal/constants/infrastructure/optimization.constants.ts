/**
 * Optimization Constants for EveryTriv (Server-only)
 *
 * @module OptimizationConstants
 * @description Optimization-related enums and constants for server-side operations
 * @used_by server/src/internal/types/core/nest.types.ts, server/src/internal/middleware/bulkOperations.middleware.ts
 */

/**
 * Optimization level enumeration
 * @enum {string} OptimizationLevel
 * @description Levels of optimization for bulk operations
 * @used_by server/src/internal/types/core/nest.types.ts, server/src/internal/middleware/bulkOperations.middleware.ts
 */
export enum OptimizationLevel {
	NONE = 'none',
	BASIC = 'basic',
	AGGRESSIVE = 'aggressive',
}
