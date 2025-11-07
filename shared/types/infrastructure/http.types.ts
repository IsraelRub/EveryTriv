/**
 * HTTP types for EveryTriv
 * Shared between client and server
 *
 * @module HttpTypes
 * @description HTTP client and request type definitions
 */
import type { BaseData, StorageValue } from '../core/data.types';
import type { HttpError } from '../core/error.types';
import type { Logger } from './logging.types';

// Define our own base request config for HTTP requests
/**
 * Base request configuration interface
 * @description Generic HTTP request config for fetch-based requests
 * @used_by ExtendedRequestConfig, HttpErrorWithConfig
 */
export interface BaseRequestConfig {
	url?: string;
	method?: string;
	baseURL?: string;
	headers?: Record<string, string>;
	data?: StorageValue;
	params?: BaseData;
	timeout?: number;
	withCredentials?: boolean;
	maxRedirects?: number;
	validateStatus?: (status: number) => boolean;
}

// HTTP-specific types for shared usage
/**
 * Extended request configuration with additional fields
 * @description Extends BaseRequestConfig with properties for interceptors and retry logic
 * @extends BaseRequestConfig
 * @used_by server interceptors, retry logic
 */
export interface ExtendedRequestConfig extends BaseRequestConfig {
	startTime?: number;
	requestId?: string;
	_retry?: boolean;
}

/**
 * HTTP error interface with configuration
 * @description Extended HTTP error that includes request config and response data for error handling
 * Extends HttpError from core/error.types with additional BaseRequestConfig
 *
 * Usage:
 * - HttpError: Basic network errors (timeouts, connection failures)
 * - HttpErrorWithConfig: HTTP errors with full request/response context (for interceptors, retry logic)
 * - ApiError: API response errors (structured error responses from server)
 *
 * @extends HttpError
 * @used_by error interceptors, retry logic, error formatting
 */
export interface HttpErrorWithConfig extends HttpError {
	/**
	 * Request configuration (overrides HttpError.config with more specific type)
	 */
	config?: BaseRequestConfig;
	/**
	 * Request object when request was made but no response received
	 * @description Used to detect network errors vs server errors
	 */
	request?: StorageValue;
}

export interface WindowWithLogger {
	logger?: Logger;
}
