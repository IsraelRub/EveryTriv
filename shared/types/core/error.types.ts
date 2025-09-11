/**
 * Error types for EveryTriv
 * Shared between client and server
 *
 * @module ErrorTypes
 * @description Error handling and error response structures
 */
import type { BaseData, BasicValue } from './data.types';

/**
 * Base error interface
 * @interface BaseError
 * @description Base error structure
 */
export interface BaseError {
	/** Error message */
	message: string;
	/** Error code */
	code?: string;
	/** HTTP status code */
	statusCode: number;
	/** Error timestamp */
	timestamp?: string;
}

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
export type ErrorDetails = BaseData | BasicValue | null;
