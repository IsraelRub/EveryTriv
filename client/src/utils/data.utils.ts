/**
 * Client-side data manipulation utilities
 *
 * @module ClientDataUtils
 * @description Data transformation and manipulation utilities for client-side use
 * @used_by client/src/components, client/src/views
 */
import { User } from '@shared/types';
import { isRecord } from '@shared/utils';

/**
 * Type guard to check if value is User
 * @param value Value to check
 * @returns True if value is User
 */
export function isUser(value: unknown): value is User {
	if (!isRecord(value)) {
		return false;
	}

	// Check required BasicUser fields
	if (typeof value.id !== 'string' || typeof value.email !== 'string') {
		return false;
	}

	// Check required User fields
	if (
		typeof value.status !== 'string' ||
		typeof value.emailVerified !== 'boolean' ||
		typeof value.authProvider !== 'string'
	) {
		return false;
	}

	// Check numeric fields
	if (
		typeof value.credits !== 'number' ||
		typeof value.purchasedCredits !== 'number' ||
		typeof value.totalCredits !== 'number' ||
		typeof value.score !== 'number'
	) {
		return false;
	}

	return true;
}
