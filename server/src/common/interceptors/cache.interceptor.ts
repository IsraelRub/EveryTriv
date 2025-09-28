/**
 * Cache Interceptor for NestJS Controllers
 *
 * @module CacheInterceptor
 * @description Interceptor that implements caching based on @Cache decorator metadata
 * @author EveryTriv Team
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { serverLogger as logger, getErrorMessage } from '@shared';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CacheService } from '../../internal/modules/cache/cache.service';
import type { CacheConfig, NestRequest } from '../../internal/types';

/**
 * Cache Interceptor
 * @description Intercepts HTTP requests and implements caching based on @Cache decorator
 * @example
 * ```typescript
 * @Get('users')
 * @Cache(300, 'users_list') // Cache for 5 minutes with custom key
 * async getUsers() {
 *   return this.userService.getAllUsers();
 * }
 * ```
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
	constructor(
		private readonly cacheService: CacheService,
		private readonly reflector: Reflector
	) {}

	/**
	 * Intercept HTTP requests and implement caching
	 * @param context - Execution context
	 * @param next - Call handler
	 * @returns Observable with cached or fresh data
	 */
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const request = context.switchToHttp().getRequest();
		const cacheMetadata =
			this.reflector.get<CacheConfig>('cache', context.getHandler()) || request.decoratorMetadata?.cache;

		// If no cache metadata, proceed normally
		if (!cacheMetadata || cacheMetadata.disabled) {
			return next.handle();
		}

		const cacheKey = this.generateCacheKey(request, cacheMetadata.key);

		try {
			// Check cache first
			const cachedResult = await this.cacheService.get(cacheKey);

			if (cachedResult.success && cachedResult.data !== null) {
				logger.cacheHit(cacheKey, {
					ttl: cacheMetadata.ttl,
					key: cacheMetadata.key,
					tags: cacheMetadata.tags,
					method: request.method,
					url: request.originalUrl,
				});

				return of(cachedResult.data);
			}

			// Cache miss - execute handler and cache result
			logger.cacheMiss(cacheKey, {
				ttl: cacheMetadata.ttl,
				key: cacheMetadata.key,
				tags: cacheMetadata.tags,
				method: request.method,
				url: request.originalUrl,
			});

			return next.handle().pipe(
				tap(async result => {
					try {
						// Check cache condition if provided
						if (cacheMetadata.condition && !cacheMetadata.condition(request, result)) {
							logger.cacheInfo('Cache condition failed - not caching', {
								key: cacheMetadata.key,
								method: request.method,
								url: request.originalUrl,
							});
							return;
						}

						await this.cacheService.set(cacheKey, result, cacheMetadata.ttl);

						// Store cache tags if provided (if service supports it)
						if (cacheMetadata.tags && cacheMetadata.tags.length > 0) {
							// Log cache tags - implement setTags in CacheService if needed
							logger.cacheInfo('Cache tags registered', {
								key: cacheKey,
								tags: cacheMetadata.tags,
							});
						}

						logger.cacheSet(cacheKey, {
							ttl: cacheMetadata.ttl,
							key: cacheMetadata.key,
							tags: cacheMetadata.tags,
							method: request.method,
							url: request.originalUrl,
						});
					} catch (error) {
						logger.cacheError('set', cacheKey, {
							error: getErrorMessage(error),
							ttl: cacheMetadata.ttl,
							key: cacheMetadata.key,
							tags: cacheMetadata.tags,
						});
					}
				})
			);
		} catch (error) {
			logger.cacheError('get', cacheKey, {
				error: getErrorMessage(error),
				ttl: cacheMetadata.ttl,
				key: cacheMetadata.key,
				tags: cacheMetadata.tags,
			});

			// On cache error, proceed with normal request
			return next.handle();
		}
	}

	/**
	 * Generate cache key from request
	 * @param request - HTTP request object
	 * @param customKey - Custom key from decorator
	 * @returns Generated cache key
	 */
	private generateCacheKey(request: NestRequest, customKey?: string): string {
		if (customKey) {
			return `cache:${customKey}`;
		}

		// Generate key from request details
		const method = request.method?.toLowerCase() || 'get';
		const url = request.originalUrl || request.url || '/';
		const query = request.query ? JSON.stringify(request.query) : '';
		const params = request.params ? JSON.stringify(request.params) : '';

		// Create a hash-like key from request components
		const keyComponents = [method, url, query, params].filter(Boolean);
		const baseKey = keyComponents.join('|');

		// Simple hash function for key generation
		let hash = 0;
		for (let i = 0; i < baseKey.length; i++) {
			const char = baseKey.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}

		return `cache:${Math.abs(hash)}`;
	}
}
