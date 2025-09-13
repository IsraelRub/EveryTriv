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
 * @param length - Length of the generated ID
 * @returns Random alphanumeric string ID
 * @description Creates a random identifier using base36 encoding for URL-safe IDs
 * @default 13
 */
export function generateId(length: number = 13): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

/**
 * Generate a trace ID for logging and debugging
 * @returns Unique trace ID (30 characters)
 * @description Creates a long unique identifier for tracing requests across services
 */
export function generateTraceId(): string {
	return generateId(15) + generateId(15);
}

/**
 * Generate a session ID for user sessions
 * @returns Unique session ID with timestamp prefix
 * @description Creates a session identifier that includes timestamp for ordering
 */
export function generateSessionId(): string {
	return Date.now().toString(36) + generateId(15);
}

/**
 * Generate a user ID for anonymous users
 * @returns Unique user ID with 'user_' prefix
 * @description Creates an identifier for anonymous or guest users
 */
export function generateUserId(): string {
	return 'user_' + generateId(10);
}

/**
 * Generate a payment intent ID for Stripe integration
 * @returns Unique payment intent ID with 'pi_' prefix
 * @description Creates Stripe-compatible payment intent identifier
 */
export function generatePaymentIntentId(): string {
	return 'pi_' + generateId(20);
}

/**
 * Generate a question ID for trivia questions
 * @returns Unique question ID with timestamp and random suffix
 * @description Creates an identifier for trivia questions that includes creation time
 */
export function generateQuestionId(): string {
	return 'q_' + Date.now() + '_' + generateId(10);
}
