/**
 * Provider Error Type Guards (server-only)
 */
import type { ProviderAuthError } from '@shared/types';
import { isRecord } from '@shared/utils';

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
