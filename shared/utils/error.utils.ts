/**
 * Error Handling Utilities
 *
 * @module ErrorUtils
 * @description Centralized error handling utilities for consistent error processing
 * @used_by server/src/features, client/src/services, shared/services
 */
import { NEST_EXCEPTION_NAMES } from '../constants/core/error.constants';
import type { AxiosErrorLike, NestExceptionName } from '../types/core/error.types';

/**
 * Enhanced error message extraction with specific error type handling
 * @param error - The error to extract message from
 * @returns The error message with enhanced context or 'Unknown error' as fallback
 */
export function getErrorMessage(error: unknown): string {
	// Handle Error instances
	if (error instanceof Error) {
		const errorName = error.constructor.name;

		// Handle Axios errors specifically
		if (errorName === 'AxiosError') {
			const axiosError = error as AxiosErrorLike;

			// Handle specific error codes
			if (['ECONNABORTED', 'ETIMEDOUT'].includes(axiosError.code ?? '')) {
				return 'Request timed out. Please check your connection and try again.';
			}
			if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET'].includes(axiosError.code ?? '')) {
				return 'Unable to connect to server. Please check your connection.';
			}

			// Handle response errors
			if (axiosError.response?.data?.message) {
				return axiosError.response.data.message;
			}
			if (axiosError.response?.data?.error) {
				return axiosError.response.data.error;
			}
			if (axiosError.response?.statusText) {
				return axiosError.response.statusText;
			}
			if (axiosError.response?.status) {
				return `Server error (${axiosError.response.status}). Please try again later.`;
			}

			return error.message ?? 'Network request failed.';
		}

		if (errorName === 'JsonWebTokenError' || errorName === 'TokenExpiredError' || errorName === 'NotBeforeError') {
			return 'Authentication failed. Please log in again.';
		}

		// Handle validation errors (check message content)
		if (error.message?.includes('validation') || error.message?.includes('invalid')) {
			return 'Invalid input data. Please check your information and try again.';
		}

		// Handle database/connection errors
		if (errorName === 'QueryFailedError' || errorName === 'ConnectionTimeoutError') {
			return 'Database operation failed. Please try again later.';
		}

		// Handle Redis/cache errors
		if (errorName === 'RedisError' || error.message?.includes('redis') || error.message?.includes('cache')) {
			return 'Cache operation failed. Please try again.';
		}

		// Handle timeout errors (check message content)
		if (error.message?.includes('timeout')) {
			return 'Operation timed out. Please try again.';
		}

		// Handle rate limiting errors (check message content)
		if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
			return 'Too many requests. Please wait a moment and try again.';
		}

		// Handle memory/resource errors
		if (error.message?.includes('memory') || error.message?.includes('out of memory')) {
			return 'Insufficient resources. Please try again later.';
		}

		// Handle file system errors
		if (error.message?.includes('ENOENT') || error.message?.includes('file not found')) {
			return 'Required file not found. Please contact support.';
		}

		// Handle permission errors
		if (error.message?.includes('EACCES') || error.message?.includes('permission denied')) {
			return 'Permission denied. Please contact support.';
		}

		// Handle NestJS exceptions
		if (NEST_EXCEPTION_NAMES.includes(errorName as NestExceptionName)) {
			return error.message ?? 'Request failed. Please try again.';
		}

		// Default Error
		return error.message ?? 'An unexpected error occurred.';
	}

	// Handle string errors
	if (typeof error === 'string') {
		return error;
	}

	// Handle null/undefined
	if (error == null) {
		return 'No error information available.';
	}

	// Handle objects with error-like properties
	if (typeof error === 'object' && error) {
		const errorObj = error as Record<string, unknown>;

		// Check for message property
		if (typeof errorObj.message === 'string') {
			return errorObj.message;
		}

		// Check for error property
		if (typeof errorObj.error === 'string') {
			return errorObj.error;
		}
	}

	// Fallback for any other type
	return 'Unknown error occurred.';
}

/**
 * Get error stack trace if available
 * @param error - The error to extract stack from
 * @returns The stack trace or 'No stack trace available' as fallback
 */
export function getErrorStack(error: unknown): string {
	if (error instanceof Error) {
		return error.stack ?? 'No stack trace available';
	}
	return 'No stack trace available';
}

/**
 * Get error type for logging
 * @param error - The error to process
 * @returns Error type string
 */
export function getErrorType(error: unknown): string {
	return error instanceof Error ? error.constructor.name : typeof error;
}

/**
 * Ensure error is an Error object for logging with stack traces
 * @param error - The error to normalize
 * @returns Error object suitable for errorWithStack logging
 */
export function ensureErrorObject(error: unknown): Error {
	return error instanceof Error ? error : new Error(getErrorMessage(error));
}

