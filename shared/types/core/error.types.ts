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
export type NestExceptionName = typeof import('../../constants/core/error.constants').NEST_EXCEPTION_NAMES[number];


/**
 * Axios error interface
 * @interface AxiosErrorLike
 * @description Axios-like error structure for network requests
 */
export interface AxiosErrorLike extends Error {
	code?: 'ECONNABORTED' | 'ENOTFOUND' | 'ECONNREFUSED' | string;
	response?: {
		status?: number;
		data?: {
			message?: string;
		};
	};
}

/**
 * Generic error-like object interface
 * @interface ErrorLike
 * @description Generic object that might contain error information
 */
export interface ErrorLike {
	message?: string;
	error?: string;
}
