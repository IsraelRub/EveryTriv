/**
 * Error types for EveryTriv
 * Shared between client and server
 *
 * @module ErrorTypes
 * @description Error handling and error response structures
 */
import type { BaseData } from './data.types';

/**
 * Error value interface
 * @interface ErrorValue
 * @description Value that represents an error
 */
export interface ErrorValue {
	/** Error message */
	message: string;
	/** Error code */
	code?: string | number;
	/** Error details */
	details?: Record<string, unknown>;
	/** Error stack trace */
	stack?: string;
	/** Error name */
	name?: string;
}

/**
 * Error details type for API error responses
 * @type ErrorDetails
 * @description Flexible error details structure
 */
export type ErrorDetails = BaseData | string | number | boolean | null;
