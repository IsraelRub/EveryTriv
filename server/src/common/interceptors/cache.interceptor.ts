import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { HttpMethod, VALIDATORS } from '@shared/constants';
import type { StorageValue } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { StorageOperation } from '@internal/constants';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { CacheConfig, NestRequest } from '@internal/types';

const isExpressResponse = (value: unknown): value is Response =>
	isRecord(value) && VALIDATORS.function(value.status) && VALIDATORS.function(value.setHeader);

const isCacheableValue = (value: unknown): value is StorageValue => {
	if (value === undefined) {
		return false;
	}

	if (value === null || Object.values(VALIDATORS).some(validator => validator(value))) {
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

@Injectable()
export class CacheInterceptor implements NestInterceptor {
	constructor(
		private readonly cacheService: CacheService,
		private readonly reflector: Reflector
	) {}

	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		const request = context.switchToHttp().getRequest<NestRequest>();

		// Read cache decorator metadata directly from handler
		const handler = context.getHandler();
		const cacheMetadata = this.reflector.get<CacheConfig>('cache', handler);

		// If no cache metadata or caching is disabled, proceed normally
		// Also skip caching if ttl is 0 (NoCache decorator)
		if (!cacheMetadata || (cacheMetadata.disabled ?? false) || cacheMetadata.ttl === 0) {
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
						logger.cacheError(StorageOperation.SET, cacheKey, {
							errorInfo: { message: getErrorMessage(error) },
							ttl: cacheMetadata.ttl,
							key: cacheMetadata.key,
							tags: cacheMetadata.tags,
						});
					}
				})
			);
		} catch (error) {
			logger.cacheError(StorageOperation.GET, cacheKey, {
				errorInfo: { message: getErrorMessage(error) },
				ttl: cacheMetadata.ttl,
				key: cacheMetadata.key,
				tags: cacheMetadata.tags,
			});

			// On cache error, proceed with normal request
			return next.handle();
		}
	}

	private generateCacheKey(request: NestRequest, customKey?: string): string {
		// Get user ID from request if available (for user-specific caching)
		const userId = request.user?.sub ?? 'anonymous';

		if (customKey) {
			// Include userId in custom keys to make them user-specific
			return `cache:${customKey}:${userId}`;
		}

		// Generate key from request details
		const method = (request.method ?? HttpMethod.GET).toLowerCase();
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
