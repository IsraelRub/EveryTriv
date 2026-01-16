import type { StorageValue } from './data.types';

export interface BaseApiResponse<T = StorageValue> {
	data: T;

	success: boolean;

	statusCode: number;

	timestamp: string;

	message?: string;
}

export interface UrlResponse {
	success: boolean;

	url?: string;

	message?: string;
}

export interface CorePagination {
	limit: number;

	total: number;
}

export interface PagePagination extends CorePagination {
	page: number;

	totalPages: number;

	hasNext: boolean;

	hasPrev: boolean;
}

export interface OffsetPagination extends CorePagination {
	offset: number;

	hasMore: boolean;
}

export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
	pagination: PagePagination;
}
