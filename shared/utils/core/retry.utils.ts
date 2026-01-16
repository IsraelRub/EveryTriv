import { HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES, VALIDATORS } from '@shared/constants';
import type { JitterOptions, RetryConfig, RetryOptions, RetryResponse } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { ensureErrorObject } from './error.utils';
import { calculateDuration } from './number.utils';

// Adds randomness to retry delays to prevent thundering herd problem.
function calculateJitter(delay: number, options?: JitterOptions): number {
	if (!Number.isFinite(delay) || delay < 0) {
		return 0;
	}

	const opts = options ?? {};
	const { percentage = 0.1, maxJitter = 1000, fixedJitter } = opts;

	// Fixed jitter takes precedence
	if (VALIDATORS.number(fixedJitter) && fixedJitter >= 0) {
		return Math.random() * fixedJitter;
	}

	// Calculate percentage-based jitter
	const percentageJitter = delay * Math.max(0, Math.min(1, percentage));
	const cappedJitter = Math.min(percentageJitter, maxJitter);

	return Math.random() * cappedJitter;
}

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
	if (VALIDATORS.number(retryAfter) && retryAfter > 0) {
		delay = retryAfter * 1000; // Convert seconds to milliseconds
	} else if (useExponentialBackoff) {
		// Exponential backoff: baseDelay * (exponentBase ^ attempt)
		delay = baseDelay * Math.pow(exponentBase, attempt);
	} else {
		// Linear backoff: baseDelay * (attempt + 1)
		delay = baseDelay * (attempt + 1);
	}

	// Apply min/max constraints
	if (VALIDATORS.number(minDelay) && minDelay >= 0) {
		delay = Math.max(delay, minDelay);
	}

	if (VALIDATORS.number(maxDelay) && maxDelay >= 0) {
		delay = Math.min(delay, maxDelay);
	}

	// Add jitter if enabled
	if (jitter !== null && jitter !== undefined) {
		const jitterValue = calculateJitter(delay, jitter);
		delay = delay + jitterValue;
	}

	return Math.round(delay);
}

// Extract Retry-After header from response headers
function extractRetryAfterFromHeaders(headers?: Headers): number | undefined {
	if (!headers) {
		return undefined;
	}

	const retryAfterHeader = headers.get('Retry-After');
	if (!retryAfterHeader) {
		return undefined;
	}

	const parsed = parseInt(retryAfterHeader, 10);
	if (!isNaN(parsed) && parsed > 0) {
		return parsed;
	}

	return undefined;
}

export async function executeRetry<T>(
	requestFn: () => Promise<T>,
	config: RetryConfig = {}
): Promise<RetryResponse<T>> {
	const {
		maxRetries = HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
		baseDelay = HTTP_CLIENT_CONFIG.RETRY_DELAY,
		timeout = HTTP_CLIENT_CONFIG.TIMEOUT,
		retryOptions = {},
		retryOnAuthError = false,
		retryOnRateLimit = true,
		retryOnServerError = true,
		retryOnNetworkError = true,
		signal,
		responseHeaders,
		shouldRetry: customShouldRetry,
		onRetry,
		onError,
	} = config;

	const startTime = Date.now();
	let lastError: Error | null = null;
	let lastStatusCode: number | null = null;
	let retryAfterSeconds: number | undefined;
	let currentResponseHeaders: Headers | undefined = responseHeaders;
	const retryDelays: number[] = [];

	// Extract Retry-After from response headers if available
	if (currentResponseHeaders) {
		const headerRetryAfter = extractRetryAfterFromHeaders(currentResponseHeaders);
		if (headerRetryAfter !== undefined) {
			retryAfterSeconds = headerRetryAfter;
		}
	}

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		// Check if external signal is aborted before attempting
		if (signal?.aborted) {
			const abortError = new Error('Request aborted');
			abortError.name = 'AbortError';
			Object.assign(abortError, {
				isAborted: true,
				statusCode: 0,
			});
			throw abortError;
		}

		try {
			// Create AbortController for timeout
			const timeoutController = new AbortController();
			let timeoutId: ReturnType<typeof setTimeout> | undefined;

			// Set up timeout if provided
			if (timeout > 0) {
				timeoutId = setTimeout(() => {
					timeoutController.abort();
				}, timeout);
			}

			// Set up signal cleanup handlers
			const abortHandlers: (() => void)[] = [];

			// Handle external signal cleanup
			if (signal) {
				if (signal.aborted) {
					if (timeoutId) {
						clearTimeout(timeoutId);
					}
					const abortError = new Error('Request aborted');
					abortError.name = 'AbortError';
					Object.assign(abortError, {
						isAborted: true,
						statusCode: 0,
					});
					throw abortError;
				}

				// Set up cleanup handler for external signal
				const abortHandler = () => {
					if (timeoutId) {
						clearTimeout(timeoutId);
					}
				};
				signal.addEventListener('abort', abortHandler);
				abortHandlers.push(() => signal.removeEventListener('abort', abortHandler));
			}

			try {
				const result = await requestFn();

				// Cleanup timeout
				if (timeoutId) {
					clearTimeout(timeoutId);
				}

				// Cleanup signal listeners
				abortHandlers.forEach(cleanup => cleanup());

				const duration = calculateDuration(startTime);
				return {
					data: result,
					attempts: attempt + 1,
					duration,
					retryDelays: retryDelays.length > 0 ? retryDelays : undefined,
				};
			} catch (error) {
				// Cleanup timeout
				if (timeoutId) {
					clearTimeout(timeoutId);
				}

				// Cleanup signal listeners
				abortHandlers.forEach(cleanup => cleanup());

				throw error;
			}
		} catch (error) {
			lastError = ensureErrorObject(error);

			// Extract response headers from error if available (set by api.service.ts)
			if (isRecord(error) && 'responseHeaders' in error && error.responseHeaders instanceof Headers) {
				currentResponseHeaders = error.responseHeaders;
			}

			// Check if it's an abort error - handle immediately without retry logic
			if (lastError.name === 'AbortError' || signal?.aborted) {
				const abortError = new Error(signal?.aborted ? 'Request aborted' : `Request timed out after ${timeout}ms`);
				abortError.name = 'AbortError';
				Object.assign(abortError, {
					isTimeoutError: !signal?.aborted,
					isAborted: signal?.aborted ?? false,
					statusCode: 0,
				});
				// Log error before throwing
				if (onError) {
					onError(abortError, attempt + 1, true);
				}
				throw abortError;
			}

			// Extract status code from error
			if ('statusCode' in lastError && VALIDATORS.number(lastError.statusCode)) {
				lastStatusCode = lastError.statusCode;
			} else if (
				'response' in lastError &&
				isRecord(lastError.response) &&
				VALIDATORS.number(lastError.response.status)
			) {
				lastStatusCode = lastError.response.status;
			}

			// Check if it's a timeout error (only if not already an Error with statusCode)
			if (
				(lastError.message.includes('timeout') || lastError.message.includes('timed out')) &&
				!('statusCode' in lastError && VALIDATORS.number(lastError.statusCode))
			) {
				const timeoutError = new Error(`Request timed out after ${timeout}ms`);
				Object.assign(timeoutError, {
					isTimeoutError: true,
					statusCode: lastStatusCode ?? 0,
					cause: lastError,
				});
				lastError = timeoutError;
			}

			// Check if it's a network error (only if not already an Error with statusCode)
			if (
				(lastError.message === 'fetch failed' ||
					lastError.message.includes('fetch failed') ||
					lastError.message.includes('network') ||
					lastError.message.includes('NetworkError') ||
					lastError.message.includes('Failed to fetch')) &&
				!('statusCode' in lastError && VALIDATORS.number(lastError.statusCode))
			) {
				const networkError = new Error(
					`Network error: ${getErrorMessage(lastError)}. This may be due to network issues, SSL/TLS problems, or the service being temporarily unavailable.`
				);
				Object.assign(networkError, {
					cause: lastError,
					isNetworkError: true,
					statusCode: lastStatusCode ?? 0,
				});
				lastError = networkError;
			}

			// Extract Retry-After from response headers if not already set
			if (retryAfterSeconds === undefined && currentResponseHeaders) {
				const headerRetryAfter = extractRetryAfterFromHeaders(currentResponseHeaders);
				if (headerRetryAfter !== undefined) {
					retryAfterSeconds = headerRetryAfter;
				}
			}

			// Determine if we should retry
			let shouldRetry = false;

			if (customShouldRetry) {
				shouldRetry = customShouldRetry(lastError, lastStatusCode, attempt);
			} else {
				// Default retry logic
				// Note: attempt check is handled by loop condition, no need to check here
				if (lastStatusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
					// 401 - don't retry unless explicitly enabled
					shouldRetry = retryOnAuthError;
				} else if (lastStatusCode === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
					// 429 - retry with rate limit handling
					shouldRetry = retryOnRateLimit;
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
				onError(lastError, attempt + 1, !shouldRetry || attempt >= maxRetries);
			}

			// If we shouldn't retry or this is the last attempt, throw the error
			if (!shouldRetry || attempt >= maxRetries) {
				if (lastStatusCode !== null && lastError instanceof Error) {
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
					retryAfter: retryAfterSeconds,
					jitter: retryOptions.jitter ?? { maxJitter: 1000 },
				});
			}

			// Store retry delay for metadata
			retryDelays.push(retryDelay);

			// Log retry attempt
			if (onRetry) {
				onRetry(attempt + 1, lastError, retryDelay);
			}

			// Wait before retrying, but check for abort signal periodically
			try {
				await new Promise<void>((resolve, reject) => {
					if (signal?.aborted) {
						reject(new Error('Request aborted during retry delay'));
						return;
					}

					const delayTimeoutId = setTimeout(() => {
						if (signal?.aborted) {
							reject(new Error('Request aborted during retry delay'));
						} else {
							resolve();
						}
					}, retryDelay);

					// Listen for abort signal during delay
					if (signal) {
						const abortHandler = () => {
							clearTimeout(delayTimeoutId);
							reject(new Error('Request aborted during retry delay'));
						};
						signal.addEventListener('abort', abortHandler);

						// Cleanup listener when timeout completes
						setTimeout(() => {
							signal.removeEventListener('abort', abortHandler);
						}, retryDelay);
					}
				});
			} catch (delayError) {
				// If delay was aborted, throw abort error immediately
				const abortError = ensureErrorObject(delayError);
				abortError.name = 'AbortError';
				Object.assign(abortError, {
					isAborted: true,
					statusCode: 0,
				});
				// Log error before throwing
				if (onError) {
					onError(abortError, attempt + 1, true);
				}
				throw abortError;
			}
		}
	}

	// If we get here, all retries failed - this should never happen as errors are thrown inside the loop
	// But we keep this as a safety net
	const finalError = lastError ?? new Error(`Request failed after ${maxRetries} retries`);
	if (lastStatusCode !== null && finalError instanceof Error) {
		Object.assign(finalError, { statusCode: lastStatusCode });
	}
	// Log final error before throwing
	if (onError && lastError) {
		onError(finalError, maxRetries + 1, true);
	}
	throw finalError;
}
