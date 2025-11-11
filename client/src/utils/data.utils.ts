/**
 * Client-side data manipulation utilities
 *
 * @module ClientDataUtils
 * @description Data transformation and manipulation utilities for client-side use
 * @used_by client/src/components, client/src/views
 */
import { isRecord } from '@shared/utils';

export { isSubscriptionData, isSubscriptionPlans, isPointPurchaseOptionArray } from '@shared/utils';

/**
 * Generate a user ID for anonymous users
 * @returns Unique user ID with 'user_' prefix
 * @description Creates an identifier for anonymous or guest users
 */
export function generateUserId(): string {
	return 'user_' + Math.random().toString(36).substring(2, 12);
}

/**
 * Type guard to check if value is User
 * @param value Value to check
 * @returns True if value is User
 */
export function isUser(value: unknown): value is import('@shared/types').User {
	if (!isRecord(value)) {
		return false;
	}

	// Check required BasicUser fields
	if (typeof value.id !== 'string' || typeof value.username !== 'string' || typeof value.email !== 'string') {
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
		typeof value.purchasedPoints !== 'number' ||
		typeof value.totalPoints !== 'number' ||
		typeof value.score !== 'number'
	) {
		return false;
	}

	return true;
}
