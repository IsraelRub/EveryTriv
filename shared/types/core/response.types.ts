/**
 * Response types for EveryTriv
 * Shared between client and server
 *
 * @module ResponseTypes
 * @description Basic response structures and wrappers
 */
import type { StorageValue } from './data.types';

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
 * Response with optional URL
 * @interface UrlResponse
 * @description Response that may include a URL
 */
export interface UrlResponse {
	success: boolean;
	message?: string;
	url?: string;
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
