/**
 * Base Interceptor Manager
 *
 * @module BaseInterceptorManager
 * @description Base class for all interceptor managers to reduce code duplication
 * @used_by client/src/services/interceptors/*.interceptor.ts
 */
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import type { InterceptorOptions, RegisteredInterceptor } from '../../types';

/**
 * Base interceptor manager
 * @description Provides common functionality for all interceptor managers
 * @template TInterceptor - Interceptor function type
 * @template TInput - Input type for interceptor execution
 * @template TOutput - Output type for interceptor execution
 */
export abstract class BaseInterceptorManager<
	TInterceptor extends (input: TInput) => TInput | TOutput | Promise<TInput | TOutput>,
	TInput,
	TOutput = TInput,
> {
	protected interceptors: RegisteredInterceptor<TInterceptor>[] = [];

	/**
	 * Get the prefix for interceptor IDs
	 * @returns Prefix string for IDs
	 */
	protected abstract getIdPrefix(): string;

	/**
	 * Execute a single interceptor
	 * @param interceptor - Interceptor function to execute
	 * @param input - Input value to pass to interceptor
	 * @returns Result from interceptor execution
	 */
	protected abstract executeInterceptor(interceptor: TInterceptor, input: TInput): Promise<TOutput>;

	/**
	 * Get the error context name for logging
	 * @returns Context name for error messages
	 */
	protected abstract getErrorContext(): string;

	/**
	 * Register a new interceptor
	 * @param interceptor - Interceptor function
	 * @param options - Interceptor options
	 * @returns Unique identifier for removal
	 */
	use(interceptor: TInterceptor, options?: InterceptorOptions): string {
		const id = `${this.getIdPrefix()}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
	 * @param input - Input value to pass through interceptors
	 * @returns Transformed output
	 */
	async execute(input: TInput): Promise<TOutput> {
		let result: TInput | TOutput = input;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				result = await this.executeInterceptor(registered.interceptor, result as TInput);
			} catch (error) {
				logger.apiError(`${this.getErrorContext()} interceptor error`, { error: getErrorMessage(error) });
				// Error interceptors continue with original error, others throw
				if (this.shouldThrowOnError()) {
					throw error;
				}
			}
		}

		return result as TOutput;
	}

	/**
	 * Determine if errors should be thrown or continued
	 * @returns True if errors should be thrown, false if should continue
	 */
	protected shouldThrowOnError(): boolean {
		return true;
	}

	/**
	 * Get count of registered interceptors
	 * @returns Number of interceptors
	 */
	getCount(): number {
		return this.interceptors.length;
	}
}
