/**
 * Retry Utilities
 * Unified retry utilities for handling HTTP requests with retry logic
 * Supports 401 (auth), 429 (rate limit), timeout, network errors, and server errors
 * Includes retry delay calculation utilities with exponential backoff and jitter
 */
import { HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES } from '@shared/constants';
import type { JitterOptions, RetryConfig, RetryOptions, RetryResponse } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';
import { calculateDuration } from './number.utils';
import { ensureErrorObject } from './error.utils';

/**
 * Calculate jitter value for retry delays
 * @param delay Base delay in milliseconds
 * @param options Jitter calculation options
 * @returns Jitter value in milliseconds
 * @description Adds randomness to retry delays to prevent thundering herd problem
 * @internal Used internally by calculateRetryDelay
 */
function calculateJitter(delay: number, options?: JitterOptions): number {
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
 * @used_by client/src/services/infrastructure/queryClient.service.ts (React Query config), executeRetry
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

/**
 * Execute a request with retry logic
 * @template T - The return type of the request function
 * @param requestFn - Function that returns a promise to execute
 * @param config - Retry configuration options
 * @returns Promise with retry response containing data, attempts, and duration
 * @description Handles HTTP requests with automatic retry logic for various error types
 */
export async function executeRetry<T>(requestFn: () => Promise<T>, config: RetryConfig = {}): Promise<RetryResponse<T>> {
		const {
			maxRetries = HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			baseDelay = HTTP_CLIENT_CONFIG.RETRY_DELAY,
			timeout = HTTP_CLIENT_CONFIG.TIMEOUT,
			retryOptions = {},
			retryOnAuthError = false,
			retryOnRateLimit = true,
			retryOnServerError = true,
			retryOnNetworkError = true,
			shouldRetry: customShouldRetry,
			onRetry,
			onError,
		} = config;

		const startTime = Date.now();
		let lastError: Error | null = null;
		let lastStatusCode: number | null = null;
		let retryAfterSeconds: number | undefined;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Create AbortController for timeout
				const abortController = new AbortController();
				const timeoutId = setTimeout(() => {
					abortController.abort();
				}, timeout);

				try {
					const result = await requestFn();
					clearTimeout(timeoutId);

					const duration = calculateDuration(startTime);
					return {
						data: result,
						attempts: attempt + 1,
						duration,
					};
				} catch (error) {
					clearTimeout(timeoutId);
					throw error;
				}
			} catch (error) {
				lastError = ensureErrorObject(error);

				// Extract status code from error
				if ('statusCode' in lastError && typeof lastError.statusCode === 'number') {
					lastStatusCode = lastError.statusCode;
				} else if ('response' in lastError && isRecord(lastError.response) && typeof lastError.response.status === 'number') {
					lastStatusCode = lastError.response.status;
				}

				// Check if it's a timeout error
				if (lastError.name === 'AbortError' || lastError.message.includes('aborted')) {
					lastError = new Error(`Request timed out after ${timeout}ms`);
					Object.assign(lastError, {
						isTimeoutError: true,
					});
				}

				// Check if it's a network error
				if (
					lastError.message === 'fetch failed' ||
					lastError.message.includes('fetch failed') ||
					lastError.message.includes('network')
				) {
					const networkError = new Error(
						`Network error: ${getErrorMessage(lastError)}. This may be due to network issues, SSL/TLS problems, or the service being temporarily unavailable.`
					);
					Object.assign(networkError, {
						cause: lastError,
						isNetworkError: true,
					});
					lastError = networkError;
				}

				// Determine if we should retry
				let shouldRetry = false;

				if (customShouldRetry) {
					shouldRetry = customShouldRetry(lastError, lastStatusCode, attempt);
				} else {
					// Default retry logic
					if (attempt >= maxRetries) {
						shouldRetry = false;
					} else if (lastStatusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
						// 401 - don't retry unless explicitly enabled
						shouldRetry = retryOnAuthError;
					} else if (lastStatusCode === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
						// 429 - retry with rate limit handling
						shouldRetry = retryOnRateLimit;

					// Extract Retry-After header if available
					if ('retryAfter' in lastError && typeof lastError.retryAfter === 'number') {
						retryAfterSeconds = lastError.retryAfter;
					}
					} else if (
						lastStatusCode !== null &&
						lastStatusCode >= HTTP_STATUS_CODES.SERVER_ERROR_MIN &&
						lastStatusCode <= HTTP_STATUS_CODES.SERVER_ERROR_MAX
					) {
						// 5xx - server errors
						shouldRetry = retryOnServerError;
					} else if (lastStatusCode === null || lastStatusCode === 0) {
						// Network errors (no status code)
						shouldRetry = retryOnNetworkError;
					} else {
						// Other errors - don't retry by default
						shouldRetry = false;
					}
				}

				// Log error
				if (onError) {
					onError(lastError, attempt + 1, !shouldRetry);
				}

				// If we shouldn't retry or this is the last attempt, throw the error
				if (!shouldRetry || attempt >= maxRetries) {
					if (lastStatusCode && lastError instanceof Error) {
						Object.assign(lastError, { statusCode: lastStatusCode });
					}
					throw lastError;
				}

				// Calculate retry delay
				let retryDelay: number;

				if (lastStatusCode === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
					// Rate limit - use longer delay
					const rateLimitBaseDelay = Math.max(baseDelay * 5, HTTP_CLIENT_CONFIG.RETRY_DELAY_RATE_LIMIT);
					retryDelay = calculateRetryDelay(rateLimitBaseDelay, attempt, {
						...retryOptions,
						retryAfter: retryAfterSeconds,
						minDelay: HTTP_CLIENT_CONFIG.RETRY_DELAY_RATE_LIMIT,
						jitter: retryOptions.jitter ?? { maxJitter: 2000 },
					});
				} else {
					// Regular retry
					retryDelay = calculateRetryDelay(baseDelay, attempt, {
						...retryOptions,
						jitter: retryOptions.jitter ?? { maxJitter: 1000 },
					});
				}

				// Log retry attempt
				if (onRetry) {
					onRetry(attempt + 1, lastError, retryDelay);
				}

				// Wait before retrying
				await new Promise(resolve => setTimeout(resolve, retryDelay));
			}
		}

	// If we get here, all retries failed
	const finalError = lastError || new Error(`Request failed after ${maxRetries} retries`);
	if (lastStatusCode && finalError instanceof Error) {
		Object.assign(finalError, { statusCode: lastStatusCode });
	}
	throw finalError;
}
