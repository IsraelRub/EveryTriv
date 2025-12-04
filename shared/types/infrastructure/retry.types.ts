/**
 * Retry Types
 * @module RetryTypes
 * @description Type definitions for retry and jitter utilities
 */

/**
 * Options for jitter calculation
 * @interface JitterOptions
 * @description Configuration for adding randomness to retry delays
 */
export interface JitterOptions {
	percentage?: number;
	maxJitter?: number;
	fixedJitter?: number;
}

/**
 * Options for retry delay calculation
 * @interface RetryOptions
 * @description Configuration for retry delay calculation with exponential backoff
 */
export interface RetryOptions {
	useExponentialBackoff?: boolean;
	exponentBase?: number;
	minDelay?: number;
	maxDelay?: number;
	retryAfter?: number;
	jitter?: JitterOptions;
}
