/**
 * Request Interceptor Manager
 *
 * @module RequestInterceptor
 * @description Manages request interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import type { EnhancedRequestConfig, RequestInterceptor } from '../../types';
import { BaseInterceptorManager } from './base.interceptor-manager';

/**
 * Request interceptor manager
 * @description Handles registration and execution of request interceptors
 */
export class RequestInterceptorManager extends BaseInterceptorManager<
	RequestInterceptor,
	EnhancedRequestConfig,
	EnhancedRequestConfig
> {
	protected getIdPrefix(): string {
		return 'req';
	}

	protected async executeInterceptor(
		interceptor: RequestInterceptor,
		config: EnhancedRequestConfig
	): Promise<EnhancedRequestConfig> {
		return await interceptor(config);
	}

	protected getErrorContext(): string {
		return 'Request';
	}
}
