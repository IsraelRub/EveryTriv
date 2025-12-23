/**
 * Response Interceptor Manager
 *
 * @module ResponseInterceptor
 * @description Manages response interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import type { ApiResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { clientLogger as logger } from '@/services';

import type { ResponseInterceptor } from '@/types';

import { BaseInterceptorManager } from './base.interceptor-manager';

/**
 * Response interceptor manager
 * @description Handles registration and execution of response interceptors
 */
export class ResponseInterceptorManager extends BaseInterceptorManager<
	ResponseInterceptor,
	ApiResponse<unknown>,
	ApiResponse<unknown>
> {
	/**
	 * Execute all registered interceptors
	 * @template T - Response data type
	 * @param response API response
	 * @returns Transformed response
	 */
	async execute<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
		let result: ApiResponse<T> = response;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				result = await this.executeInterceptor(registered.interceptor, result);
			} catch (error) {
				logger.apiError('Response interceptor error', { error: getErrorMessage(error) });
				throw error;
			}
		}

		return result;
	}

	protected getIdPrefix(): string {
		return 'res';
	}

	protected async executeInterceptor<T>(
		interceptor: ResponseInterceptor,
		response: ApiResponse<T>
	): Promise<ApiResponse<T>> {
		return await interceptor(response);
	}

	protected getErrorContext(): string {
		return 'Response';
	}
}
