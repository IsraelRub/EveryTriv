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
	message: string;
	code?: string;
	statusCode: number;
	timestamp?: string;
}

/**
 * Error value interface
 * @interface ErrorValue
 * @description Value that represents an error
 */
export interface ErrorValue {
	message: string;
	code?: string | number;
	details?: Record<string, unknown>;
	stack?: string;
	name?: string;
}

/**
 * Error details type for API error responses
 * @type ErrorDetails
 * @description Flexible error details structure
 */
export type ErrorDetails = BaseData | BasicValue | null;
