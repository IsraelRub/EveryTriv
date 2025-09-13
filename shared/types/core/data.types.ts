/**
 * Data types for EveryTriv
 * Shared between client and server
 *
 * @module DataTypes
 * @description Basic data structures and generic value types
 */

/**
 * Generic value type for metadata and configuration
 * @type BasicValue
 * @description Union type for all possible metadata and configuration values
 */
export type BasicValue = string | number | boolean;

/**
 * Extended metadata value type for complex objects
 * @type StatsValue
 * @description Extended type for metadata that includes dates and objects
 */
export type StatsValue = BasicValue | Date | Record<string, BasicValue | Date>;

/**
 * Generic data value interface
 * @type StorageValue
 * @description Generic data value that can be stored in cache or transmitted
 */
export type StorageValue = BasicValue | Record<string, unknown> | BasicValue[] | unknown[] | Date | null | undefined;

/**
 * Base entity interface with common fields
 * @interface BaseEntity
 * @description Base interface for all entities with common fields
 */
export interface BaseEntity {
	/** Unique identifier */
	id: string;
	/** Creation timestamp */
	createdAt: Date;
	/** Last update timestamp */
	updatedAt: Date;
}

/**
 * Authentication request interface
 * @interface AuthRequest
 * @description Request interface with user authentication data
 */
export interface AuthRequest {
	/** User data */
	user: {
		/** User ID */
		id: string;
		/** User role */
		role: string;
		/** User email */
		email: string;
		/** User username */
		username: string;
	};
}

/**
 * Authentication credentials interface
 * @interface AuthCredentials
 * @description User login credentials
 */
export interface AuthCredentials {
	/** Email address */
	email: string;
	/** Username */
	username: string;
	/** Password */
	password: string;
}

/**
 * Authentication response interface
 * @interface AuthResponse
 * @description Response from authentication service
 */
export interface AuthResponse {
	/** Access token */
	accessToken: string;
	/** Refresh token */
	refreshToken?: string;
	/** User data */
	user: {
		/** User ID */
		id: string;
		/** Username */
		username: string;
		/** Email */
		email: string;
		/** Role */
		role: string;
	};
}

/**
 * Base data interface
 * @type BaseData
 * @description Base interface for flexible data structures
 */
export interface BaseData
	extends Record<string, number | boolean | string | string[] | BaseData | BaseData[] | Date | undefined> {}

/**
 * Form data interface
 * @interface FormData
 * @description Generic form data structure
 */
export type FormData = BaseData;

/**
 * API request body interface
 * @type ApiRequestBody
 * @description Generic API request body structure
 */
export type ApiRequestBody = BaseData;

/**
 * Request data interface
 * @type RequestData
 * @description Generic request data structure
 */
export type RequestData = BaseData;

/**
 * Sanitized request data interface
 * @type SanitizedRequestData
 * @description Generic sanitized request data structure
 */
export type SanitizedRequestData = BaseData;

/**
 * TypeORM specific types for database operations
 * @module TypeORMTypes
 * @description Type definitions for TypeORM operations and queries
 */

/**
 * Type for TypeORM update operations
 * Handles partial updates with proper type safety
 */
export type TypeORMUpdateData<T> = Partial<T>;

/**
 * Type for TypeORM where conditions
 * Ensures proper typing for find operations
 */
export type TypeORMWhereCondition<T> = Partial<T>;

/**
 * Type for TypeORM find options
 * Provides type safety for repository find operations
 */
export interface TypeORMFindOptions<T> {
	where?: TypeORMWhereCondition<T>;
	select?: Array<keyof T>;
	relations?: Array<string>;
	order?: Partial<Record<keyof T, 'ASC' | 'DESC'>>;
	skip?: number;
	take?: number;
}

/**
 * Type for TypeORM save operations
 * Handles both create and update operations
 */
export interface TypeORMSaveData extends Record<string, unknown> {
	id?: string | number;
}

// LogMeta is now defined in logging.types.ts to avoid conflicts
