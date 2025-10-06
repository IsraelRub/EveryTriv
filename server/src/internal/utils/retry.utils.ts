import {
	ApiError,
	AxiosErrorWithConfig,
	ExtendedAxiosRequestConfig,
	HTTP_ERROR_CODES,
	HTTP_ERROR_MESSAGES,
	HTTP_LOG_MESSAGES,
	createServerError,
	serverLogger as logger,
} from '@shared';
import { AxiosResponse } from 'axios';

/**
 * Utility class for handling HTTP retry logic
 */
export class RetryUtils {
	private retryAttempts: number;
	private retryDelay: number;

	constructor(retryAttempts: number, retryDelay: number) {
		this.retryAttempts = retryAttempts;
		this.retryDelay = retryDelay;
	}

	/**
	 * Check if the error should trigger a retry with enhanced logic
	 */
	shouldRetry(error: AxiosErrorWithConfig): boolean {
		// Retry on network errors
		if (!error.response) {
			return true;
		}

		// Enhanced retry logic with specific status codes
		const status = error.response.status;
		const retryableStatuses = [408, 429, 500, 502, 503, 504];
		const isRetryableStatus = retryableStatuses.includes(status);

		// Check if we haven't exceeded max retries
		const config = error.config as ExtendedAxiosRequestConfig;
		const currentRetries = (config as ExtendedAxiosRequestConfig & { _retryCount?: number })._retryCount || 0;
		const maxRetries =
			(config as ExtendedAxiosRequestConfig & { _maxRetries?: number })._maxRetries || this.retryAttempts;

		return isRetryableStatus && currentRetries < maxRetries;
	}

	/**
	 * Retry a failed request with exponential backoff
	 */
	async retryRequest(
		config: ExtendedAxiosRequestConfig,
		requestFn: (config: ExtendedAxiosRequestConfig) => Promise<AxiosResponse>
	): Promise<AxiosResponse> {
		config._retry = true;
		let lastError: AxiosErrorWithConfig | undefined;

		for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
			try {
				// Add exponential backoff with jitter
				if (attempt > 1) {
					const delay = this.retryDelay * Math.pow(2, attempt - 1);
					const jitter = Math.random() * 0.1 * delay;
					await this.sleep(delay + jitter);
				}

				logger.httpSuccess(`${HTTP_LOG_MESSAGES.RETRY_ATTEMPT} ${attempt}/${this.retryAttempts}`, {
					url: config.url || 'unknown',
					method: config.method || 'UNKNOWN',
					attempt,
					totalAttempts: this.retryAttempts,
				});

				return await requestFn(config);
			} catch (error) {
				lastError = error as AxiosErrorWithConfig;
				logger.httpClientError(`${HTTP_LOG_MESSAGES.RETRY_FAILED} ${attempt} failed`, {
					url: config.url || 'unknown',
					message: (error as AxiosErrorWithConfig).message,
					attempt,
					totalAttempts: this.retryAttempts,
				});
			}
		}

		if (lastError) {
			throw this.formatError(lastError);
		}
		throw createServerError('retry request', new Error('Retry failed with no error information'));
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Format error for consistent error handling
	 */
	formatError(error: AxiosErrorWithConfig): ApiError {
		if (error.response) {
			// Server responded with error status
			return {
				message: error.response.data?.message || HTTP_ERROR_MESSAGES.DEFAULT,
				statusCode: error.response.status,
				code: HTTP_ERROR_CODES.DEFAULT,
				details: error.response.data,
			} as ApiError;
		} else if (error.request) {
			// Request was made but no response received
			return {
				message: HTTP_ERROR_MESSAGES.NETWORK_ERROR,
				statusCode: 0,
				code: HTTP_ERROR_CODES.NETWORK_ERROR,
				details: { request: 'request object' },
			} as ApiError;
		} else {
			// Something else happened
			return {
				message: error.message || HTTP_ERROR_MESSAGES.DEFAULT,
				statusCode: 0,
				code: HTTP_ERROR_CODES.DEFAULT,
				details: { error: error.message },
			} as ApiError;
		}
	}
}
