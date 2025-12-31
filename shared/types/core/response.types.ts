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
 * Core pagination interface
 * @interface CorePagination
 * @description Base pagination fields shared by all pagination types
 */
export interface CorePagination {
	/** Number of items per page/request */
	limit: number;
	/** Total number of items available */
	total: number;
}

/**
 * Page-based pagination interface
 * @interface PagePagination
 * @description Pagination structure using page numbers (1-based)
 * @extends CorePagination
 */
export interface PagePagination extends CorePagination {
	/** Current page number (1-based) */
	page: number;
	/** Total number of pages */
	totalPages: number;
	/** Whether there is a next page */
	hasNext: boolean;
	/** Whether there is a previous page */
	hasPrev: boolean;
}

/**
 * Offset-based pagination interface
 * @interface OffsetPagination
 * @description Pagination structure using offset/limit for cursor-based navigation
 * @extends CorePagination
 */
export interface OffsetPagination extends CorePagination {
	offset: number;
	hasMore: boolean;
}

/**
 * Paginated response interface
 * @interface PaginatedResponse
 * @description Paginated response with items and pagination metadata
 */
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
	pagination: PagePagination;
}
