import type { ApiError, ApiResponse } from '@shared/types';

export interface EnhancedRequestConfig extends RequestInit {
	baseURL?: string;
	timeout?: number;
	signal?: AbortSignal;
	skipAuth?: boolean;
	skipDeduplication?: boolean;
	requestId?: string;
}

export type RequestInterceptor = (
	config: EnhancedRequestConfig
) => EnhancedRequestConfig | Promise<EnhancedRequestConfig>;

export type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

export type InterceptorFn = RequestInterceptor | ResponseInterceptor | ErrorInterceptor;

export interface InterceptorEntry<T extends InterceptorFn = InterceptorFn> {
	interceptor: T;
	enabled: boolean;
}
