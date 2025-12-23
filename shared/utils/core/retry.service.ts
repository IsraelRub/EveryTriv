/**
 * Retry Service
 * Unified retry service for handling HTTP requests with retry logic
 * Supports 401 (auth), 429 (rate limit), timeout, network errors, and server errors
 */
import { HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES } from '@shared/constants';
import type { RetryOptions } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { calculateRetryDelay } from './retry.utils';

/**
 * Retry configuration options
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
 */
export interface RetryResponse<T> {
	data: T;
	attempts: number;
	duration: number;
}

/**
 * Unified retry service for HTTP requests
 */
export class RetryService {
	/**
	 * Execute a request with retry logic
	 */
	static async execute<T>(requestFn: () => Promise<T>, config: RetryConfig = {}): Promise<RetryResponse<T>> {
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

					const duration = Date.now() - startTime;
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
				lastError = error instanceof Error ? error : new Error(String(error));

				// Extract status code from error
				if (isRecord(lastError)) {
					if (typeof lastError.statusCode === 'number') {
						lastStatusCode = lastError.statusCode;
					} else if (isRecord(lastError.response) && typeof lastError.response.status === 'number') {
						lastStatusCode = lastError.response.status;
					}
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
						if (isRecord(lastError) && typeof lastError.retryAfter === 'number') {
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
}

/**
 * Type guard to check if value is a record
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
