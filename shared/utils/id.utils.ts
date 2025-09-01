/**
 * Shared ID generation utilities for EveryTriv
 * Used by both client and server for generating unique identifiers
 *
 * @module IdUtils
 * @description Unique identifier generation utilities
 * @used_by shared/services/logging.service.ts (generateTraceId, generateSessionId), client: client/src/utils/user.util.ts (generateUserId), server: server/src/features/game/logic/providers/management/base.provider.ts (generateQuestionId), server: server/src/features/payment/services/payment.service.ts (generatePaymentIntentId)
 */

/**
 * Generate a random ID using base36 encoding
 * @param length Length of the ID (default: 13)
 * @returns string Random ID
 */
export function generateId(length: number = 13): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

/**
 * Generate a trace ID for logging and debugging
 * @returns string Unique trace ID
 */
export function generateTraceId(): string {
	return generateId(15) + generateId(15);
}

/**
 * Generate a session ID for user sessions
 * @returns string Unique session ID
 */
export function generateSessionId(): string {
	return Date.now().toString(36) + generateId(15);
}

/**
 * Generate a user ID for anonymous users
 * @returns string Unique user ID
 */
export function generateUserId(): string {
	return 'user_' + generateId(10);
}

/**
 * Generate a payment intent ID
 * @returns string Unique payment intent ID
 */
export function generatePaymentIntentId(): string {
	return 'pi_' + generateId(20);
}

/**
 * Generate a question ID
 * @returns string Unique question ID
 */
export function generateQuestionId(): string {
	return 'q_' + Date.now() + '_' + generateId(10);
}
