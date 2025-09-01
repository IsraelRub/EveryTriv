/**
 * Response types for EveryTriv
 * Shared between client and server
 *
 * @module ResponseTypes
 * @description Basic response structures and wrappers
 */
import type { ApiRequestBody } from './data.types';

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
