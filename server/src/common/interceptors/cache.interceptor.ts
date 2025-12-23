/**
 * Cache Interceptor for NestJS Controllers
 *
 * @module CacheInterceptor
 * @description Interceptor that implements caching based on @Cache decorator metadata
 * @author EveryTriv Team
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { StorageValue } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { CacheService } from '@internal/modules/cache/cache.service';
import { serverLogger as logger } from '@internal/services';
import type { CacheConfig, NestRequest } from '@internal/types';
import { isBoolean, isNumber, isString } from '@internal/utils';

const isExpressResponse = (value: unknown): value is Response =>
	isRecord(value) && typeof value.status === 'function' && typeof value.setHeader === 'function';

const isCacheableValue = (value: unknown): value is StorageValue => {
	if (value === null) {
		return true;
	}

	if (value === undefined) {
		return false;
	}

	if (isString(value) || isNumber(value) || isBoolean(value)) {
		return true;
	}

	if (value instanceof Date) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.every(isCacheableValue);
	}

	if (isRecord(value)) {
		return Object.values(value).every(isCacheableValue);
	}

	return false;
};

/**
 * Cache Interceptor
 * @description Intercepts HTTP requests and implements caching based on @Cache decorator
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
	constructor(
		private readonly cacheService: CacheService,
		private readonly reflector: Reflector
	) {}

	/**
	 * Intercept HTTP requests and implement caching
	 * @param context Execution context
	 * @param next Call handler
	 * @returns Observable with cached or fresh data
	 */
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		const request = context.switchToHttp().getRequest<NestRequest>();

		// Read cache decorator metadata directly from handler (most reliable)
		const handler = context.getHandler();
		const decoratorCache = this.reflector.get<CacheConfig>('cache', handler);

		// Use decorator metadata if available, otherwise fall back to middleware metadata
		const cacheMetadata = decoratorCache ?? request.decoratorMetadata?.cache;

		// If no cache metadata or caching is disabled, proceed normally
		// Also skip caching if ttl is 0 (NoCache decorator)
		if (!cacheMetadata || cacheMetadata.disabled || cacheMetadata.ttl === 0) {
			return next.handle();
		}

		const cacheKey = this.generateCacheKey(request, cacheMetadata.key);

		try {
			// Check cache first
			const cachedResult = await this.cacheService.get(cacheKey);

			if (cachedResult.success && cachedResult.data) {
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
						if (cacheMetadata.condition) {
							if (!isExpressResponse(result)) {
								logger.cacheInfo('Cache condition skipped - result is not an Express response', {
									key: cacheMetadata.key,
									method: request.method,
									url: request.originalUrl,
								});
								return;
							}

							if (!cacheMetadata.condition(request, result)) {
								logger.cacheInfo('Cache condition failed - not caching', {
									key: cacheMetadata.key,
									method: request.method,
									url: request.originalUrl,
								});
								return;
							}
						}

						if (!isCacheableValue(result)) {
							logger.cacheInfo('Cache skipped - result not serializable', {
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
	 * @param request HTTP request object
	 * @param customKey Custom key from decorator
	 * @returns Generated cache key
	 */
	private generateCacheKey(request: NestRequest, customKey?: string): string {
		// Get user ID from request if available (for user-specific caching)
		const userId = request.user?.sub ?? request.user?.id ?? 'anonymous';

		if (customKey) {
			// Include userId in custom keys to make them user-specific
			return `cache:${customKey}:${userId}`;
		}

		// Generate key from request details
		const method = request.method?.toLowerCase() ?? 'get';
		const url = request.originalUrl ?? request.url ?? '/';
		const query = request.query ? JSON.stringify(request.query) : '';
		const params = request.params ? JSON.stringify(request.params) : '';

		// Create a hash-like key from request components INCLUDING userId
		const keyComponents = [method, url, query, params, userId].filter(Boolean);
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
