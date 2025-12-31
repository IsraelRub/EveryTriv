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

/**
 * Retry configuration options
 * @interface RetryConfig
 * @description Configuration for retry service execution
 */
export interface RetryConfig {
	maxRetries?: number;
	baseDelay?: number;
	timeout?: number;
	retryOptions?: RetryOptions;
	retryOnAuthError?: boolean;
	retryOnRateLimit?: boolean;
	retryOnServerError?: boolean;
	retryOnNetworkError?: boolean;
	shouldRetry?: (error: unknown, statusCode: number | null, attempt: number) => boolean;
	onRetry?: (attempt: number, error: unknown, delay: number) => void;
	onError?: (error: unknown, attempt: number, isFinal: boolean) => void;
}

/**
 * Response from retry service
 * @interface RetryResponse
 * @description Response returned after successful retry execution
 * @template T The type of data returned
 */
export interface RetryResponse<T> {
	data: T;
	attempts: number;
	duration: number;
}
