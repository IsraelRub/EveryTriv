/**
 * Error Interceptor Manager
 *
 * @module ErrorInterceptor
 * @description Manages error interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import type { ApiError } from '@shared/types';

import type { ErrorInterceptor } from '../../types';
import { BaseInterceptorManager } from './base.interceptor-manager';

/**
 * Error interceptor manager
 * @description Handles registration and execution of error interceptors
 */
export class ErrorInterceptorManager extends BaseInterceptorManager<ErrorInterceptor, ApiError, ApiError> {
	protected getIdPrefix(): string {
		return 'err';
	}

	protected async executeInterceptor(interceptor: ErrorInterceptor, error: ApiError): Promise<ApiError> {
		return await interceptor(error);
	}

	protected getErrorContext(): string {
		return 'Error';
	}

	/**
	 * Error interceptors should continue with original error if interceptor fails
	 * @returns False to continue with original error instead of throwing
	 */
	protected shouldThrowOnError(): boolean {
		return false;
	}
}
