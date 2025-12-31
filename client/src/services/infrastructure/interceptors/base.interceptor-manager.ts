/**
 * Base Interceptor Manager
 *
 * @module BaseInterceptorManager
 * @description Base class for all interceptor managers to reduce code duplication
 * @used_by client/src/services/interceptors/*.interceptor.ts
 */
import { generateInterceptorId, getErrorMessage } from '@shared/utils';
import { clientLogger as logger } from '@/services';
import type { InterceptorOptions, RegisteredInterceptor } from '@/types';

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
	 * @param interceptor Interceptor function to execute
	 * @param input Input value to pass to interceptor
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
	 * @param interceptor Interceptor function
	 * @param options Interceptor options
	 * @returns Unique identifier for removal
	 */
	use(interceptor: TInterceptor, options?: InterceptorOptions): string {
		const id = generateInterceptorId(this.getIdPrefix());
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
	 * @param id Interceptor identifier
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
	 * @param input Input value to pass through interceptors
	 * @returns Transformed output
	 */
	async execute(input: TInput): Promise<TOutput> {
		// Start with input, which is TInput
		// After each interceptor, result becomes TOutput (or remains TInput if TInput === TOutput)
		let currentValue: TInput | TOutput = input;

		for (const registered of this.interceptors) {
			if (!registered.options.enabled) {
				continue;
			}

			try {
				// Type narrowing: if this is the first iteration, currentValue is TInput
				// For subsequent iterations, when TInput !== TOutput, currentValue is TOutput from previous interceptor
				// executeInterceptor's signature handles both cases: (interceptor: TInterceptor, input: TInput) => Promise<TOutput>
				// When TInput === TOutput, no transformation occurs and types remain the same
				// When TInput !== TOutput, the first interceptor transforms TInput to TOutput,
				// and subsequent interceptors receive TOutput as TInput (intended behavior for transformation chains)
				// We cast to TInput here because executeInterceptor expects TInput, and we handle the transformation internally
				const interceptorInput: TInput = currentValue as TInput;
				const interceptorResult = await this.executeInterceptor(registered.interceptor, interceptorInput);
				currentValue = interceptorResult;
			} catch (error) {
				logger.apiError(`${this.getErrorContext()} interceptor error`, { error: getErrorMessage(error) });
				// Error interceptors continue with original error, others throw
				if (this.shouldThrowOnError()) {
					throw error;
				}
			}
		}

		// After all interceptors, currentValue is guaranteed to be TOutput by the type system
		// The last interceptor result is always TOutput by executeInterceptor's return type
		// TypeScript's control flow analysis cannot track this through the loop, but the type signature guarantees it
		const finalValue: TOutput = currentValue as TOutput;
		return finalValue;
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
