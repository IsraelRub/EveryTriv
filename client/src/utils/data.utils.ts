/**
 * Client-side data manipulation utilities
 *
 * @module ClientDataUtils
 * @description Data transformation and manipulation utilities for client-side use
 * @used_by client/src/components, client/src/views
 */
import { PlanType } from '@shared/constants';
import type { SubscriptionData, SubscriptionPlans } from '@shared/types';
import { isRecord } from '@shared/utils';

/**
 * Generate a user ID for anonymous users
 * @returns Unique user ID with 'user_' prefix
 * @description Creates an identifier for anonymous or guest users
 */
export function generateUserId(): string {
	return 'user_' + Math.random().toString(36).substring(2, 12);
}

/**
 * Type guard to check if value is SubscriptionData
 * @param value Value to check
 * @returns True if value is SubscriptionData
 */
export function isSubscriptionData(value: unknown): value is SubscriptionData {
	if (!isRecord(value)) {
		return false;
	}

	// startDate can be Date (server) or string (API response after JSON serialization)
	const isStartDateValid = value.startDate instanceof Date || typeof value.startDate === 'string';
	// endDate can be Date (server) or string (API response), or null
	const isEndDateValid = value.endDate === null || value.endDate instanceof Date || typeof value.endDate === 'string';

	return (
		typeof value.planType === 'string' &&
		Object.values(PlanType).includes(value.planType as PlanType) &&
		typeof value.status === 'string' &&
		isStartDateValid &&
		isEndDateValid &&
		typeof value.price === 'number' &&
		Array.isArray(value.features)
	);
}

/**
 * Type guard to check if value is SubscriptionPlans
 * @param value Value to check
 * @returns True if value is SubscriptionPlans
 */
export function isSubscriptionPlans(value: unknown): value is SubscriptionPlans {
	if (!isRecord(value)) {
		return false;
	}

	if (!value.basic || !value.premium || !value.pro) {
		return false;
	}

	if (!isRecord(value.basic) || !isRecord(value.premium) || !isRecord(value.pro)) {
		return false;
	}

	return (
		typeof value.basic.price === 'number' &&
		typeof value.premium.price === 'number' &&
		typeof value.pro.price === 'number'
	);
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
