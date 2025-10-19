/**
 * Repository Interceptor
 *
 * @module RepositoryInterceptor
 * @description Interceptor that handles repository method decorators and caching
 * @author EveryTriv Team
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { CacheService } from '../../internal/modules/cache/cache.service';
import type { CacheMetadata } from '../../internal/types/metadata.types';

/**
 * Repository Interceptor
 * @description Intercepts repository method calls and implements decorator functionality
 */
@Injectable()
export class RepositoryInterceptor implements NestInterceptor {
	constructor(
		private readonly cacheService: CacheService,
		private readonly reflector: Reflector
	) {}

	/**
	 * Intercept repository method calls and implement decorator functionality
	 * @param context - Execution context
	 * @param next - Call handler
	 * @returns Observable with cached or fresh data
	 */
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		const handler = context.getHandler();
		const className = context.getClass().name;
		const methodName = handler.name;

		// Check for repository cache decorator
		const cacheMetadata = this.reflector.get<CacheMetadata>('repositoryCache', handler);

		if (cacheMetadata) {
			return this.handleCachedMethod(context, next, cacheMetadata, className, methodName);
		}

		// Check for audit decorator
		const auditMetadata = this.reflector.get<{ action: string }>('repositoryAudit', handler);
		if (auditMetadata) {
			return this.handleAuditedMethod(context, next, auditMetadata, className, methodName);
		}

		// Check for rate limit decorator
		const rateLimitMetadata = this.reflector.get<{ limit: number; window: number }>('repositoryRateLimit', handler);
		if (rateLimitMetadata) {
			return this.handleRateLimitedMethod(context, next, rateLimitMetadata, className, methodName);
		}

		// Default behavior - just log and proceed
		return this.handleDefaultMethod(context, next, className, methodName);
	}

	/**
	 * Handle cached repository method
	 */
	private async handleCachedMethod(
		_context: ExecutionContext,
		next: CallHandler,
		cacheMetadata: CacheMetadata,
		className: string,
		methodName: string
	): Promise<Observable<unknown>> {
		const args = _context.getArgs();
		const cacheKey = this.generateRepositoryCacheKey(className, methodName, args, cacheMetadata.key);

		try {
			// Check cache first
			const cachedResult = await this.cacheService.get(cacheKey);

			if (cachedResult.success && cachedResult.data) {
				logger.cacheHit(cacheKey, {
					context: 'REPOSITORY',
					className,
					methodName,
					ttl: cacheMetadata.ttl,
				});

				return of(cachedResult.data);
			}

			// Cache miss - execute method and cache result
			logger.cacheMiss(cacheKey, {
				context: 'REPOSITORY',
				className,
				methodName,
				ttl: cacheMetadata.ttl,
			});

			return next.handle().pipe(
				tap(async result => {
					try {
						await this.cacheService.set(cacheKey, result, cacheMetadata.ttl);

						logger.cacheSet(cacheKey, {
							context: 'REPOSITORY',
							className,
							methodName,
							ttl: cacheMetadata.ttl,
						});
					} catch (error) {
						logger.cacheError('set', cacheKey, {
							context: 'REPOSITORY',
							className,
							methodName,
							error: getErrorMessage(error),
						});
					}
				})
			);
		} catch (error) {
			logger.cacheError('get', cacheKey, {
				context: 'REPOSITORY',
				className,
				methodName,
				error: getErrorMessage(error),
			});

			// On cache error, proceed with normal method call
			return next.handle();
		}
	}

	/**
	 * Handle audited repository method
	 */
	private handleAuditedMethod(
		_context: ExecutionContext,
		next: CallHandler,
		auditMetadata: { action: string },
		className: string,
		methodName: string
	): Observable<unknown> {
		const args = _context.getArgs();
		const startTime = Date.now();

		return next.handle().pipe(
			tap(_result => {
				const duration = Date.now() - startTime;

				logger.audit(auditMetadata.action, {
					context: 'REPOSITORY',
					className,
					methodName,
					args: this.sanitizeArgs(args),
					result: this.sanitizeResult(_result),
					duration,
					success: true,
				});
			}),
			catchError(error => {
				const duration = Date.now() - startTime;

				logger.audit(auditMetadata.action, {
					context: 'REPOSITORY',
					className,
					methodName,
					args: this.sanitizeArgs(args),
					error: getErrorMessage(error),
					duration,
					success: false,
				});

				throw error;
			})
		);
	}

	/**
	 * Handle rate limited repository method
	 */
	private handleRateLimitedMethod(
		_context: ExecutionContext,
		next: CallHandler,
		rateLimitMetadata: { limit: number; window: number },
		className: string,
		methodName: string
	): Observable<unknown> {
		// For now, just log the rate limit attempt
		// In a full implementation, you would check against a rate limiter
		logger.performance('repository.rate_limit_check', 0, {
			context: 'REPOSITORY',
			className,
			methodName,
			limit: rateLimitMetadata.limit,
			window: rateLimitMetadata.window,
		});

		return next.handle();
	}

	/**
	 * Handle default repository method
	 */
	private handleDefaultMethod(
		_context: ExecutionContext,
		next: CallHandler,
		className: string,
		methodName: string
	): Observable<unknown> {
		const startTime = Date.now();

		return next.handle().pipe(
			tap(_result => {
				const duration = Date.now() - startTime;

				logger.databaseInfo(`Repository method completed: ${className}.${methodName}`, {
					context: 'REPOSITORY',
					className,
					methodName,
					duration,
					success: true,
				});
			}),
			catchError(error => {
				const duration = Date.now() - startTime;

				logger.databaseError(`Repository method failed: ${className}.${methodName}`, {
					context: 'REPOSITORY',
					className,
					methodName,
					error: getErrorMessage(error),
					duration,
					success: false,
				});

				throw error;
			})
		);
	}

	/**
	 * Generate cache key for repository method
	 */
	private generateRepositoryCacheKey(
		className: string,
		methodName: string,
		args: unknown[],
		customKey?: string
	): string {
		if (customKey) {
			return `repo:${customKey}`;
		}

		// Generate key from method and arguments
		const argsString = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join('|');

		const baseKey = `${className}.${methodName}:${argsString}`;

		// Simple hash function for key generation
		let hash = 0;
		for (let i = 0; i < baseKey.length; i++) {
			const char = baseKey.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}

		return `repo:${Math.abs(hash)}`;
	}

	/**
	 * Sanitize arguments for logging
	 */
	private sanitizeArgs(args: unknown[]): unknown[] {
		return args.map(arg => {
			if (typeof arg === 'object' && arg) {
				// Remove sensitive fields
				const sanitized = { ...arg };
				if ('password' in sanitized) delete sanitized.password;
				if ('token' in sanitized) delete sanitized.token;
				return sanitized;
			}
			return arg;
		});
	}

	/**
	 * Sanitize result for logging
	 */
	private sanitizeResult(result: unknown): unknown {
		if (typeof result === 'object' && result) {
			// Remove sensitive fields
			const sanitized = { ...result };
			if ('password' in sanitized) delete sanitized.password;
			if ('token' in sanitized) delete sanitized.token;
			return sanitized;
		}
		return result;
	}
}
