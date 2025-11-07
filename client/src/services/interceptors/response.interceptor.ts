/**
 * Response Interceptor Manager
 *
 * @module ResponseInterceptor
 * @description Manages response interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import { clientLogger as logger } from '@shared/services';
import type { ApiResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import type { InterceptorOptions, RegisteredInterceptor, ResponseInterceptor } from '../../types';

/**
 * Response interceptor manager
 * @description Handles registration and execution of response interceptors
 */
export class ResponseInterceptorManager {
	private interceptors: RegisteredInterceptor<ResponseInterceptor>[] = [];

	/**
	 * Register a new response interceptor
	 * @param interceptor - Interceptor function
	 * @param options - Interceptor options
	 * @returns Unique identifier for removal
	 */
	use(interceptor: ResponseInterceptor, options?: InterceptorOptions): string {
		const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.interceptors.push({
			interceptor,
			options: {
				priority: options?.priority ?? 0,
				enabled: options?.enabled ?? true,
			},
			id,
		});

		// Sort by priority (lower first)
		this.interceptors.sort((a, b) => (a.options.priority ?? 0) - (b.options.priority ?? 0));

		return id;
	}

	/**
	 * Remove an interceptor by ID
	 * @param id - Interceptor identifier
	 * @returns True if removed, false if not found
	 */
	eject(id: string): boolean {
		const index = this.interceptors.findIndex(reg => reg.id === id);
		if (index !== -1) {
			this.interceptors.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Clear all interceptors
	 */
	clear(): void {
		this.interceptors = [];
	}

	/**
	 * Execute all registered interceptors
	 * @template T - Response data type
	 * @param response - API response
	 * @returns Transformed response
	 */
	async execute<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
		let result = response;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				result = await registered.interceptor<T>(result);
			} catch (error) {
				logger.apiError('Response interceptor error', { error: getErrorMessage(error) });
				throw error;
			}
		}

		return result;
	}

	/**
	 * Get count of registered interceptors
	 * @returns Number of interceptors
	 */
	getCount(): number {
		return this.interceptors.length;
	}
}
