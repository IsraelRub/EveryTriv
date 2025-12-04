import { NEST_EXCEPTION_NAMES } from '../../constants';
import { ErrorResponseData } from '../infrastructure';

/**
 * Error types for EveryTriv
 * Shared between client and server
 *
 * @module ErrorTypes
 * @description Error handling and error response structures
 */

/**
 * NestJS exception names type derived from constants
 * @type NestExceptionName
 * @description Type derived from NEST_EXCEPTION_NAMES constant
 */
export type NestExceptionName = (typeof NEST_EXCEPTION_NAMES)[number];

/**
 * HTTP error interface
 * @interface HttpError
 * @description HTTP error structure for network requests
 */
export interface HttpError extends Error {
	code?: 'ECONNABORTED' | 'ENOTFOUND' | 'ECONNREFUSED' | 'ECONNRESET' | 'ETIMEDOUT' | string;
	response?: {
		status?: number;
		statusText?: string;
		data?: ErrorResponseData;
	};
	config?: {
		url?: string;
		method?: string;
		timeout?: number;
	};
}

/**
 * Provider error with authentication error flag
 * @interface ProviderAuthError
 * @description Error from AI provider indicating authentication failure
 */
export interface ProviderAuthError extends Error {
	statusCode?: number;
	isAuthError: true;
	provider?: string;
}

/**
 * Provider error with rate limit error flag
 * @interface ProviderRateLimitError
 * @description Error from AI provider indicating rate limit exceeded
 */
export interface ProviderRateLimitError extends Error {
	statusCode?: number;
	isRateLimitError: true;
	retryAfter?: number;
	provider?: string;
}

/**
 * Provider error with status code
 * @interface ProviderErrorWithStatusCode
 * @description Error from AI provider with HTTP status code
 */
export interface ProviderErrorWithStatusCode extends Error {
	statusCode: number;
}
