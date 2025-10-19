import { serverLogger as logger } from '@shared/services';
import type { AxiosErrorWithConfig, ExtendedAxiosRequestConfig } from '@shared/types';
import { HTTP_LOG_MESSAGES } from '@shared/constants';
import { generateId } from '@shared/utils';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { RetryUtils } from './retry.utils';

/**
 * Utility class for setting up HTTP interceptors
 */
export class InterceptorsUtils {
	private retryUtils: RetryUtils;

	constructor(retryUtils: RetryUtils) {
		this.retryUtils = retryUtils;
	}

	/**
	 * Generate unique request ID for tracking
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${generateId(9)}`;
	}

	/**
	 * Set up request and response interceptors for logging and error handling with enhanced features
	 */
	setupInterceptors(instance: AxiosInstance): void {
		// Request interceptor with enhanced logging
		instance.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				const startTime = Date.now();
				const requestId = this.generateRequestId();

				logger.httpSuccess(HTTP_LOG_MESSAGES.REQUEST, {
					method: config.method?.toUpperCase() || 'UNKNOWN',
					url: config.url || 'unknown',
					startTime: startTime.toString(),
					requestId,
					userAgent: config.headers?.['user-agent'] || 'unknown',
					contentType: config.headers?.['content-type'] || 'unknown',
				});

				// Store enhanced metadata for response logging
				(config as ExtendedAxiosRequestConfig).startTime = startTime;
				(config as ExtendedAxiosRequestConfig).requestId = requestId;
				return config;
			},
			(error: AxiosErrorWithConfig) => {
				logger.httpClientError('HTTP Client Error', {
					message: error.message,
				});
				return Promise.reject(error);
			}
		);

		// Response interceptor
		instance.interceptors.response.use(
			(response: AxiosResponse) => {
				const endTime = Date.now();
				const startTime = (response.config as ExtendedAxiosRequestConfig).startTime || endTime;
				const duration = endTime - startTime;

				logger.httpSuccess(HTTP_LOG_MESSAGES.RESPONSE, {
					method: response.config.method?.toUpperCase() || 'UNKNOWN',
					url: response.config.url || 'unknown',
					status: response.status.toString(),
					duration: `${duration}ms`,
				});

				return response;
			},
			async (error: AxiosErrorWithConfig) => {
				const endTime = Date.now();
				const startTime = (error.config as ExtendedAxiosRequestConfig)?.startTime || endTime;
				const duration = endTime - startTime;

				logger.httpClientError('HTTP Client Error', {
					method: error.config?.method?.toUpperCase() || 'UNKNOWN',
					url: error.config?.url || 'unknown',
					status: error.response?.status?.toString() || '0',
					statusText: error.response?.statusText || 'unknown',
					duration: `${duration}ms`,
					message: error.message,
				});

				// Retry logic for network errors and 5xx server errors
				if (
					this.retryUtils.shouldRetry(error) &&
					error.config &&
					!(error.config as ExtendedAxiosRequestConfig)._retry
				) {
					return this.retryUtils.retryRequest(
						error.config as ExtendedAxiosRequestConfig,
						(config: ExtendedAxiosRequestConfig) => instance.request(config as AxiosRequestConfig)
					);
				}

				return Promise.reject(this.retryUtils.formatError(error));
			}
		);
	}
}
