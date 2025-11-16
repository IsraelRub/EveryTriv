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
