import { Injectable } from '@nestjs/common';
import { BaseStorageService, metricsService ,
	StorageCleanupOptions,
	StorageConfig,
	StorageOperationResult,
	StorageStats,
	StorageService,
} from '@shared';
import { RedisClient } from '@shared/types/infrastructure/redis.types';

/**
 * Server-side persistent storage service using Redis
 *
 * @class ServerStorageService
 * @extends BaseStorageService
 * @implements StorageService
 * @description Redis-based persistent storage for long-term data that should survive cache invalidation
 *
 * @note This service is for PERSISTENT storage only. For temporary caching, use CacheService instead.
 *
 * Usage:
 * - Session data (user sessions, game sessions)
 * - User preferences that should persist across restarts
 * - Audit logs and historical data
 * - Configuration data that needs to survive cache clears
 *
 * Do NOT use for:
 * - Temporary data that can be regenerated
 * - Frequently accessed data that should be cached
 * - Data that expires quickly
 */
@Injectable()
export class ServerStorageService extends BaseStorageService implements StorageService {
	private redisClient: RedisClient;

	constructor(redisClient: RedisClient, config: Partial<StorageConfig> = {}) {
		super({
			...config,
			type: 'persistent',
		});
		this.redisClient = redisClient;
	}

	/**
	 * Get storage service metrics
	 * @returns Storage metrics
	 */
	getMetrics() {
		return metricsService.getMetrics();
	}

	/**
	 * Reset metrics
	 */
	resetMetrics() {
		metricsService.resetMetrics();
	}

	async set<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			const serialized = this.serialize(value);
			await this.redisClient.setex(prefixedKey, ttl || this.config.defaultTtl || 3600, serialized);

			this.updateMetadata(key, serialized.length, ttl);
			this.trackOperationWithTiming('set', startTime, true, 'persistent', serialized.length);

			// Cache invalidation handled by CacheService independently

			return this.createSuccessResult<void>();
		} catch (error) {
			this.trackOperationWithTiming('set', startTime, false, 'persistent');
			return this.createErrorResult<void>(`Failed to set item: ${this.formatError(error)}`);
		}
	}

	async get<T>(key: string): Promise<StorageOperationResult<T | null>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			const value = await this.redisClient.get(prefixedKey);

			if (value === null) {
				this.trackOperationWithTiming('get', startTime, true, 'persistent');
				return this.createSuccessResult<T | null>(null);
			}

			const deserialized = this.deserialize<T>(value);
			this.updateMetadata(key, value.length);

			this.trackOperationWithTiming('get', startTime, true, 'persistent', value.length);

			return this.createSuccessResult<T | null>(deserialized);
		} catch (error) {
			this.trackOperationWithTiming('get', startTime, false, 'persistent');
			return this.createErrorResult<T | null>(`Failed to get item: ${this.formatError(error)}`);
		}
	}

	async delete(key: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			await this.redisClient.del(prefixedKey);

			this.trackOperationWithTiming('delete', startTime, true, 'persistent');
			return this.createSuccessResult<void>();
		} catch (error) {
			this.trackOperationWithTiming('delete', startTime, false, 'persistent');
			return this.createErrorResult<void>(`Failed to delete item: ${this.formatError(error)}`);
		}
	}

	async exists(key: string): Promise<StorageOperationResult<boolean>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			const result = await this.redisClient.exists(prefixedKey);

			this.trackOperationWithTiming('exists', startTime, true, 'persistent');
			return this.createSuccessResult<boolean>(result === 1);
		} catch (error) {
			this.trackOperationWithTiming('exists', startTime, false, 'persistent');
			return this.createErrorResult<boolean>(`Failed to check existence: ${this.formatError(error)}`);
		}
	}

	async clear(): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const keysResult = await this.getKeys();
			if (!keysResult.success || !keysResult.data) {
				this.trackOperationWithTiming('clear', startTime, false, 'persistent');
				return this.createErrorResult<void>('Failed to get keys for clearing');
			}

			const prefixedKeys = keysResult.data.map((key: string) => this.getPrefixedKey(key));
			if (prefixedKeys.length > 0) {
				for (const key of prefixedKeys) {
					await this.redisClient.del(key);
				}
			}

			this.trackOperationWithTiming('clear', startTime, true, 'persistent');
			return this.createSuccessResult<void>();
		} catch (error) {
			this.trackOperationWithTiming('clear', startTime, false, 'persistent');
			return this.createErrorResult<void>(`Failed to clear storage: ${this.formatError(error)}`);
		}
	}

	async getKeys(): Promise<StorageOperationResult<string[]>> {
		const startTime = Date.now();
		try {
			const pattern = `${this.config.prefix}*`;
			const keys = await this.redisClient.keys(pattern);
			const unprefixedKeys = keys.map((key: string) => key.replace(this.config.prefix, ''));

			this.trackOperationWithTiming('getKeys', startTime, true, 'persistent');
			return this.createSuccessResult<string[]>(unprefixedKeys);
		} catch (error) {
			this.trackOperationWithTiming('getKeys', startTime, false, 'persistent');
			return this.createErrorResult<string[]>(`Failed to get keys: ${this.formatError(error)}`);
		}
	}

	async getStats(): Promise<StorageOperationResult<StorageStats>> {
		return super.getStats();
	}

	async cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>> {
		return super.cleanup(options);
	}

	async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
		return super.invalidate(pattern);
	}

	async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		return super.getOrSet(key, factory, ttl);
	}
}
