import type { StorageValue } from './data.types';

export interface BaseOperationResponse {
	success: boolean;
	message: string;
}

export interface BaseApiResponse<T = StorageValue> {
	data: T;
	success: boolean;
	statusCode: number;
	timestamp: string;
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
