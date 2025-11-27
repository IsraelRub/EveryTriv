/**
 * Provider Error Type Guards
 *
 * @module ProviderErrorUtils
 * @description Type guards for provider error types with extended properties
 * @used_by server/src/features/game/logic/providers
 */
import { isRecord } from './data.utils';

/**
 * Provider error with authentication error flag
 */
export interface ProviderAuthError extends Error {
	statusCode?: number;
	isAuthError: true;
	provider?: string;
}

/**
 * Provider error with rate limit error flag
 */
export interface ProviderRateLimitError extends Error {
	statusCode?: number;
	isRateLimitError: true;
	retryAfter?: number;
	provider?: string;
}

/**
 * Provider error with status code
 */
export interface ProviderErrorWithStatusCode extends Error {
	statusCode: number;
}

/**
 * Type guard for authentication error
 */
export function isProviderAuthError(error: unknown): error is ProviderAuthError {
	if (!(error instanceof Error)) {
		return false;
	}

	if (!isRecord(error)) {
		return false;
	}

	return error.isAuthError === true;
}

/**
 * Type guard for rate limit error
 */
export function isProviderRateLimitError(error: unknown): error is ProviderRateLimitError {
	if (!(error instanceof Error)) {
		return false;
	}

	if (!isRecord(error)) {
		return false;
	}

	return error.isRateLimitError === true;
}

/**
 * Type guard for error with status code
 */
export function isProviderErrorWithStatusCode(error: unknown): error is ProviderErrorWithStatusCode {
	if (!(error instanceof Error)) {
		return false;
	}

	if (!isRecord(error)) {
		return false;
	}

	return typeof error.statusCode === 'number';
}
