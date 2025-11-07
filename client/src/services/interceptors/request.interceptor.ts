/**
 * Request Interceptor Manager
 *
 * @module RequestInterceptor
 * @description Manages request interceptors for HTTP client
 * @used_by client/src/services/api.service.ts
 */
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import type { EnhancedRequestConfig, InterceptorOptions, RegisteredInterceptor, RequestInterceptor } from '../../types';

/**
 * Request interceptor manager
 * @description Handles registration and execution of request interceptors
 */
export class RequestInterceptorManager {
	private interceptors: RegisteredInterceptor<RequestInterceptor>[] = [];

	/**
	 * Register a new request interceptor
	 * @param interceptor - Interceptor function
	 * @param options - Interceptor options
	 * @returns Unique identifier for removal
	 */
	use(interceptor: RequestInterceptor, options?: InterceptorOptions): string {
		const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
	 * @param config - Request configuration
	 * @returns Transformed configuration
	 */
	async execute(config: EnhancedRequestConfig): Promise<EnhancedRequestConfig> {
		let result = config;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				result = await registered.interceptor(result);
			} catch (error) {
				logger.apiError('Request interceptor error', { error: getErrorMessage(error) });
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
