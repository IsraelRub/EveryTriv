/**
 * Data types for EveryTriv
 * Shared between client and server
 *
 * @module DataTypes
 * @description Basic data structures and generic value types
 */

/**
 * Generic data value interface
 * @interface GenericDataValue
 * @description Generic data value that can be stored in cache or transmitted
 */
export type GenericDataValue =
	| string
	| number
	| boolean
	| Record<string, unknown>
	| unknown[]
	| Date
	| null
	| undefined;

/**
 * Base data interface
 * @interface BaseData
 * @description Base interface for flexible data structures
 */
export interface BaseData {
	[key: string]: number | boolean | string | string[] | BaseData | BaseData[] | Date | undefined;
}

/**
 * Form data interface
 * @interface FormData
 * @description Generic form data structure
 */
export type FormData = BaseData;

/**
 * API request body interface
 * @interface ApiRequestBody
 * @description Generic API request body structure
 */
export type ApiRequestBody = BaseData;

/**
 * Request data interface
 * @interface RequestData
 * @description Generic request data structure
 */
export type RequestData = BaseData;

/**
 * Sanitized request data interface
 * @interface SanitizedRequestData
 * @description Generic sanitized request data structure
 */
export type SanitizedRequestData = BaseData;

// LogMeta is now defined in logging.types.ts to avoid conflicts
