/**
 * Interceptor types for EveryTriv Client
 *
 * @module InterceptorTypes
 * @description Type definitions for HTTP request/response interceptors
 * @used_by client/src/services/api.service.ts, client/src/services/interceptors
 */
import type { ApiResponse, RequestData } from '@shared/types';

import type { ApiError } from './api.types';

/**
 * Enhanced request configuration
 * @description Extends RequestInit with additional properties for advanced request handling
 * @extends RequestInit
 */
export interface EnhancedRequestConfig extends RequestInit {
	baseURL?: string;
	timeout?: number;
	signal?: AbortSignal;
	skipAuth?: boolean;
	skipRetry?: boolean;
	skipDeduplication?: boolean;
	requestId?: string;
}

/**
 * Request interceptor function type
 * @description Transforms request config before sending
 */
export type RequestInterceptor = (
	config: EnhancedRequestConfig
) => EnhancedRequestConfig | Promise<EnhancedRequestConfig>;

/**
 * Response interceptor function type
 * @description Transforms response after receiving
 * @template T Response data type
 */
export type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

/**
 * Error interceptor function type
 * @description Handles errors before they are thrown
 */
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

/**
 * Request transformer function type
 * @description Transforms request data before sending
 */
export type RequestTransformer = (data: RequestData) => RequestData | Promise<RequestData>;

/**
 * Response transformer function type
 * @description Transforms response data after receiving
 * @template T Response data type
 */
export type ResponseTransformer = <T>(data: T) => T | Promise<T>;

/**
 * Interceptor registration options
 * @description Options for registering interceptors
 */
export interface InterceptorOptions {
	priority?: number;
	enabled?: boolean;
}

/**
 * Registered interceptor with metadata
 * @template T Interceptor function type
 */
export interface RegisteredInterceptor<T> {
	interceptor: T;
	options: InterceptorOptions;
	id: string;
}
