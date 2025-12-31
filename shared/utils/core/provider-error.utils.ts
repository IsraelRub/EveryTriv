/**
 * Provider Error Type Guards
 *
 * @module ProviderErrorUtils
 * @description Type guards for provider error types with extended properties
 * @used_by server/src/features/game/logic/providers
 */
import type { ProviderAuthError, ProviderErrorWithStatusCode, ProviderRateLimitError } from '@shared/types';

/**
 * Type guard for authentication error
 */
export function isProviderAuthError(error: unknown): error is ProviderAuthError {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'isAuthError' in error && error.isAuthError === true;
}

/**
 * Type guard for rate limit error
 */
export function isProviderRateLimitError(error: unknown): error is ProviderRateLimitError {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'isRateLimitError' in error && error.isRateLimitError === true;
}

/**
 * Type guard for error with status code
 */
export function isProviderErrorWithStatusCode(error: unknown): error is ProviderErrorWithStatusCode {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'statusCode' in error && typeof error.statusCode === 'number';
}
