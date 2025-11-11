/**
 * Error Handling Utilities
 *
 * @module ErrorUtils
 * @description Centralized error handling utilities for consistent error processing
 * @used_by server/src/features, client/src/services, shared/services
 */
import { NEST_EXCEPTION_NAMES } from '../constants';
import type { HttpError, NestExceptionName } from '../types';
import { isRecord } from './core/data.utils';

const NEST_EXCEPTION_NAME_SET = new Set<string>(NEST_EXCEPTION_NAMES);

const isNestExceptionName = (value: string): value is NestExceptionName => NEST_EXCEPTION_NAME_SET.has(value);

const isHttpError = (error: Error): error is HttpError => {
	if (!isRecord(error)) {
		return false;
	}

	const hasResponse = isRecord(error.response);
	const hasConfig = isRecord(error.config);
	const hasCode = typeof error.code === 'string';

	return hasResponse || hasConfig || hasCode;
};

/**
 * Enhanced error message extraction with specific error type handling
 * @param error - The error to extract message from
 * @returns The error message with enhanced context or 'Unknown error' as fallback
 */
export function getErrorMessage(error: unknown): string {
	// Handle Error instances
	if (error instanceof Error) {
		const errorName = error.constructor.name;

		// Handle HTTP errors with network-specific properties
		if (isHttpError(error) && (error.code || error.response)) {
			// Handle specific error codes
			if (['ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')) {
				return 'Request timed out. Please check your connection and try again.';
			}
			if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET'].includes(error.code ?? '')) {
				return 'Unable to connect to server. Please check your connection.';
			}

			// Handle response errors
			if (error.response?.data?.message) {
				return error.response.data.message;
			}
			if (error.response?.data?.error) {
				return error.response.data.error;
			}
			if (error.response?.statusText) {
				return error.response.statusText;
			}
			if (error.response?.status) {
				return `Server error (${error.response.status}). Please try again later.`;
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
		if (isNestExceptionName(errorName)) {
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
	if (isRecord(error)) {
		// Check for message property
		if (typeof error.message === 'string') {
			return error.message;
		}

		// Check for error property
		if (typeof error.error === 'string') {
			return error.error;
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
