/**
 * HTTP types for EveryTriv
 * Shared between client and server
 *
 * @module HttpTypes
 * @description HTTP client and request type definitions
 * @used_by server: server/src/shared/services/http-client.ts (HttpClient), client: client/src/services/http-client.ts (ClientHttpClient), shared/services/logging.service.ts (HTTP logging)
 */
import type { ApiRequestBody, StorageValue } from '../core/data.types';
import type { HttpLogData, HttpLogger } from './logging.types';

// Re-export for external usage
export type { HttpLogData, HttpLogger };

// Define our own base request config to avoid axios dependency
/**
 * Base request configuration interface
 * @description Generic HTTP request config without axios-specific dependencies
 * @used_by ExtendedAxiosRequestConfig, AxiosErrorWithConfig
 */
export interface BaseRequestConfig {
	url?: string;
	method?: string;
	baseURL?: string;
	headers?: Record<string, string>;
	data?: StorageValue;
	params?: ApiRequestBody;
	timeout?: number;
	withCredentials?: boolean;
	maxRedirects?: number;
	validateStatus?: (status: number) => boolean;
}

// HTTP-specific types for shared usage
/**
 * Extended request configuration with axios-specific fields
 * @description Extends BaseRequestConfig with axios-specific properties for interceptors and retry logic
 * @extends BaseRequestConfig
 * @used_by server interceptors, retry logic
 */
export interface ExtendedAxiosRequestConfig extends BaseRequestConfig {
	startTime?: number;
	requestId?: string;
	_retry?: boolean;
}

/**
 * Axios error interface with configuration
 * @description Error interface that includes request config and response data for error handling
 * @extends Error
 * @used_by error interceptors, retry logic, error formatting
 */
export interface AxiosErrorWithConfig extends Error {
	config?: BaseRequestConfig;
	response?: {
		status: number;
		statusText: string;
		data?: {
			message?: string;
			code?: string;
		};
	};
	/**
	 * XMLHttpRequest object when request was made but no response received
	 * @description Used to detect network errors vs server errors
	 */
	request?: StorageValue;
}

export interface WindowWithLogger {
	logger?: HttpLogger;
}
