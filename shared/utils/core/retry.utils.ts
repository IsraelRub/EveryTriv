/**
 * Core Retry Utilities
 *
 * @module CoreRetryUtils
 * @description Retry and jitter calculation utilities for exponential backoff with jitter
 * @used_by client/src/services, server/src/features
 */
import type { JitterOptions, RetryOptions } from '@shared/types';

/**
 * Calculate jitter value for retry delays
 * @param delay Base delay in milliseconds
 * @param options Jitter calculation options
 * @returns Jitter value in milliseconds
 * @description Adds randomness to retry delays to prevent thundering herd problem
 * @example
 * ```typescript
 * // 10% of delay, max 1000ms (default)
 * const jitter = calculateJitter(5000); // Returns 0-500ms
 *
 * // 10% of delay, max 2000ms
 * const jitter = calculateJitter(5000, { maxJitter: 2000 }); // Returns 0-500ms
 *
 * // Fixed jitter value
 * const jitter = calculateJitter(5000, { fixedJitter: 1000 }); // Returns 0-1000ms
 * ```
 */
export function calculateJitter(delay: number, options?: JitterOptions): number {
	if (!Number.isFinite(delay) || delay < 0) {
		return 0;
	}

	const opts = options ?? {};
	const { percentage = 0.1, maxJitter = 1000, fixedJitter } = opts;

	// Fixed jitter takes precedence
	if (typeof fixedJitter === 'number' && Number.isFinite(fixedJitter) && fixedJitter >= 0) {
		return Math.random() * fixedJitter;
	}

	// Calculate percentage-based jitter
	const percentageJitter = delay * Math.max(0, Math.min(1, percentage));
	const cappedJitter = Math.min(percentageJitter, maxJitter);

	return Math.random() * cappedJitter;
}

/**
 * Calculate retry delay with exponential backoff and optional jitter
 * @param baseDelay Base delay in milliseconds
 * @param attempt Current attempt number (0-indexed)
 * @param options Retry calculation options
 * @returns Calculated retry delay in milliseconds
 * @description Calculates retry delay using exponential backoff: baseDelay * (exponentBase ^ attempt)
 * @example
 * ```typescript
 * // Exponential backoff with default jitter (10%, max 1000ms)
 * const delay = calculateRetryDelay(1000, 2); // ~4000ms + jitter
 *
 * // Exponential backoff with custom jitter
 * const delay = calculateRetryDelay(1000, 2, {
 *   jitter: { maxJitter: 2000 }
 * });
 *
 * // With Retry-After header
 * const delay = calculateRetryDelay(1000, 0, {
 *   retryAfter: 5, // 5 seconds
 *   jitter: { maxJitter: 2000 }
 * });
 * ```
 */
export function calculateRetryDelay(baseDelay: number, attempt: number, options?: RetryOptions): number {
	if (!Number.isFinite(baseDelay) || baseDelay < 0) {
		return 0;
	}

	if (!Number.isFinite(attempt) || attempt < 0) {
		attempt = 0;
	}

	const opts = options ?? {};
	const { useExponentialBackoff = true, exponentBase = 2, minDelay, maxDelay, retryAfter, jitter } = opts;

	let delay: number;

	// Use Retry-After header value if provided
	if (typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0) {
		delay = retryAfter * 1000; // Convert seconds to milliseconds
	} else if (useExponentialBackoff) {
		// Exponential backoff: baseDelay * (exponentBase ^ attempt)
		delay = baseDelay * Math.pow(exponentBase, attempt);
	} else {
		// Linear backoff: baseDelay * (attempt + 1)
		delay = baseDelay * (attempt + 1);
	}

	// Apply min/max constraints
	if (typeof minDelay === 'number' && Number.isFinite(minDelay) && minDelay >= 0) {
		delay = Math.max(delay, minDelay);
	}

	if (typeof maxDelay === 'number' && Number.isFinite(maxDelay) && maxDelay >= 0) {
		delay = Math.min(delay, maxDelay);
	}

	// Add jitter if enabled
	if (jitter !== null && jitter !== undefined) {
		const jitterValue = calculateJitter(delay, jitter);
		delay = delay + jitterValue;
	}

	return Math.round(delay);
}
