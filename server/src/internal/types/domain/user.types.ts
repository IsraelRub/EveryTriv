/**
 * User Types (server-only)
 * @module ServerUserTypes
 * @description User-related type definitions
 */

/**
 * User Cache Types
 */
export interface UserSearchCacheResult extends Record<string, unknown> {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	avatar: number | null;
	displayName: string;
}

export interface UserSearchCacheEntry extends Record<string, unknown> {
	query: string;
	results: UserSearchCacheResult[];
	totalResults: number;
}

export interface AuditLogEntry extends Record<string, unknown> {
	userId: string;
	action: string;
	timestamp: string;
	ip: string;
	userAgent: string;
}

/**
 * User Operations Types
 */
export interface CustomDifficultyItem {
	description: string;
	usageCount: number;
	lastUsed: string;
}

/**
 * User registration data
 * @interface UserRegistrationData
 * @description Data for user registration (server-only)
 * @used_by server/src/features/user/user.service.ts
 */
export interface UserRegistrationData {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
}
