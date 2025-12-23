/**
 * Query Constants for EveryTriv (Server-only)
 *
 * @module QueryConstants
 * @description Query-related enums and constants for server-side operations
 * @used_by server/src/common/queries/search.query.ts, server/src/common/queries/group-by.query.ts
 */

/**
 * Wildcard pattern enumeration
 * @enum {string} WildcardPattern
 * @description Pattern types for search wildcards
 * @used_by server/src/common/queries/search.query.ts
 */
export enum WildcardPattern {
	BOTH = 'both',
	START = 'start',
	END = 'end',
	NONE = 'none',
}

/**
 * SQL condition constants
 * @constant
 * @description SQL condition values for query builders
 * @used_by server/src/common/queries/group-by.query.ts, server/src/features/game, server/src/features/analytics
 */
export const SQL_CONDITIONS = {
	IS_NOT_NULL: 'IS NOT NULL',
	IS_NULL: 'IS NULL',
} as const;
