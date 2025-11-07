/**
 * Error Interceptor Manager
 *
 * @module ErrorInterceptor
 * @description Manages error interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import { clientLogger as logger } from '@shared/services';
import type { ApiError } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import type { ErrorInterceptor, InterceptorOptions, RegisteredInterceptor } from '../../types';

/**
 * Error interceptor manager
 * @description Handles registration and execution of error interceptors
 */
export class ErrorInterceptorManager {
	private interceptors: RegisteredInterceptor<ErrorInterceptor>[] = [];

	/**
	 * Register a new error interceptor
	 * @param interceptor - Interceptor function
	 * @param options - Interceptor options
	 * @returns Unique identifier for removal
	 */
	use(interceptor: ErrorInterceptor, options?: InterceptorOptions): string {
		const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
	 * @param error - API error
	 * @returns Transformed error
	 */
	async execute(error: ApiError): Promise<ApiError> {
		let result = error;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				result = await registered.interceptor(result);
			} catch (interceptorError) {
				logger.apiError('Error interceptor error', { interceptorError: getErrorMessage(interceptorError) });
				// Continue with original error if interceptor fails
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
