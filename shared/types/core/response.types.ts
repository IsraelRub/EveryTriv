/**
 * Response types for EveryTriv
 * Shared between client and server
 *
 * @module ResponseTypes
 * @description Basic response structures and wrappers
 */
import type { ApiRequestBody, StorageValue } from './data.types';

/**
 * Base API response interface
 * @interface BaseApiResponse
 * @description Generic wrapper for all API responses
 */
export interface BaseApiResponse<T = StorageValue> {
	data: T;
	success: boolean;
	message?: string;
	statusCode?: number;
	timestamp?: string;
}

/**
 * Base response interface
 * @interface BaseResponse
 * @description Generic response structure with success status
 */
export interface BaseResponse {
	success: boolean;
	message?: string;
}

/**
 * Response with optional URL
 * @interface UrlResponse
 * @description Response that may include a URL
 */
export interface UrlResponse extends BaseResponse {
	url?: string;
}

/**
 * Response with optional data
 * @interface DataResponse
 * @description Response that may include data
 */
export interface DataResponse<T = ApiRequestBody> extends BaseResponse {
	data?: T;
}

/**
 * Success response interface
 * @interface SuccessResponse
 * @description Success response with guaranteed success status
 */
export interface SuccessResponse<T = unknown> extends BaseApiResponse<T> {
	success: true;
}

/**
 * Error response interface
 * @interface ErrorResponse
 * @description Error response with guaranteed failure status
 */
export interface ErrorResponse extends BaseApiResponse<null> {
	success: false;
	error?: {
		message: string;
		code?: string;
		details?: unknown;
	};
}

/**
 * Paginated response interface
 * @interface PaginatedResponse
 * @description Paginated response with items and pagination metadata
 */
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
	pagination: BasePagination;
}

/**
 * Metadata response interface
 * @interface MetadataResponse
 * @description Response with additional metadata
 */
export interface MetadataResponse<T> extends BaseApiResponse<T> {
	metadata?: {
		processingTime?: number;
		timestamp?: string;
		context?: Record<string, unknown>;
	};
}

/**
 * Base pagination interface
 * @interface BasePagination
 * @description Base pagination structure
 */
export interface BasePagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}
