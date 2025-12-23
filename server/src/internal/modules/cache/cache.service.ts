import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { defaultValidators, StorageType } from '@shared/constants';
import type {
	StorageCleanupOptions,
	StorageConfig,
	StorageOperationResult,
	StorageService,
	StorageStats,
	StorageValue,
} from '@shared/types';
import { createTimedResult, formatStorageError, getErrorMessage, isRecord } from '@shared/utils';

import { CACHE_CONFIG, StorageOperation } from '@internal/constants';
import { serverLogger as logger } from '@internal/services';
import type { CacheEntry } from '@internal/types';

import { deleteKeysByPattern, scanKeys } from '../../utils';

/**
 * Service for managing application caching
 *
 * @module CacheService
 * @description Handles in-memory caching and Redis caching with TTL support
 * @implements StorageService
 */
@Injectable()
export class CacheService implements StorageService, OnModuleDestroy {
	private memoryCache = new Map<string, { value: StorageValue; expiry: number | null }>();
	private useRedis: boolean = false;
	private config: StorageConfig;

	constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis | null) {
		this.useRedis = !!this.redisClient;
		this.config = {
			...CACHE_CONFIG,
			type: StorageType.CACHE,
		};
	}

	private getPrefixedKey(key: string): string {
		return `${this.config.prefix}${key}`;
	}

	/**
	 * Sets a value in cache with optional TTL
	 *
	 * @param key The cache key to store the value under
	 * @param value The value to cache
	 * @param ttl Time to live in seconds (optional)
	 * @returns Promise<StorageOperationResult<void>> Operation result with timing information
	 * @description Stores value in either Redis or memory cache with optional expiration
	 */
	async set(key: string, value: StorageValue, ttl?: number): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			const storageValue = this.normalizeStorageValue(value);

			if (this.useRedis && this.redisClient) {
				await this.setRedis(prefixedKey, storageValue, ttl);
			} else {
				this.setMemory(prefixedKey, storageValue, ttl);
			}

			logger.cacheSet(key, {
				key,
				ttl,
			});

			return createTimedResult<void>(true, undefined, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.SET, key, {
				error: getErrorMessage(error),
			});
			return createTimedResult<void>(false, undefined, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Gets a value from cache
	 *
	 * @param key The cache key to retrieve
	 * @returns Promise<StorageOperationResult<T | null>> Operation result with cached value or null
	 * @description Retrieves value from either Redis or memory cache with hit/miss logging
	 */
	async get(key: string): Promise<StorageOperationResult<StorageValue | null>>;
	async get<T extends StorageValue>(
		key: string,
		validator: (value: StorageValue) => value is T
	): Promise<StorageOperationResult<T | null>>;
	async get<T extends StorageValue>(
		key: string,
		validator?: (value: StorageValue) => value is T
	): Promise<StorageOperationResult<StorageValue | null> | StorageOperationResult<T | null>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			let value: StorageValue = null;

			if (this.useRedis && this.redisClient) {
				value = await this.getRedis(prefixedKey);
			} else {
				value = this.getMemory(prefixedKey);
			}

			if (value) {
				logger.cacheHit(key, {
					storage: this.useRedis ? 'redis' : 'memory',
				});
			} else {
				logger.cacheMiss(key, {
					storage: this.useRedis ? 'redis' : 'memory',
				});
			}

			const baseResult = createTimedResult<StorageValue | null>(true, value, undefined, startTime, StorageType.CACHE);

			if (!validator) {
				return baseResult;
			}

			if (value !== null && validator(value)) {
				return {
					...baseResult,
					data: value,
				};
			}

			if (value !== null) {
				await this.delete(key);
			}

			return createTimedResult<T | null>(false, null, 'Cache entry failed validation', startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.GET, key, {
				error: getErrorMessage(error),
			});
			return createTimedResult<T | null>(false, null, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Gets a value from cache or sets it using a factory function
	 *
	 * @param key - The cache key to retrieve or set
	 * @param factory - Function to generate value if not cached
	 * @param ttl - Time to live in seconds (optional)
	 * @returns Promise<T> The cached or newly generated value
	 * @description Implements cache-aside pattern with automatic value generation
	 */
	async getOrSet<T extends StorageValue>(
		key: string,
		factory: () => Promise<T>,
		ttl: number | undefined,
		validator?: (value: StorageValue) => value is T
	): Promise<T> {
		try {
			if (validator) {
				const cached = await this.get(key, validator);
				if (cached.success && cached.data) {
					return cached.data;
				}
			} else {
				const cached = await this.get(key);
				if (cached.success && cached.data) {
					return cached.data as T;
				}
			}

			const value = await factory();
			await this.set(key, value, ttl);
			return value;
		} catch (error) {
			logger.cacheError(StorageOperation.GET_OR_SET, key, {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Gets multiple values from cache
	 *
	 * @param keys Array of cache keys to retrieve
	 * @returns Promise<(T | null)[]> Array of cached values with null for missing keys
	 * @description Retrieves multiple values efficiently using batch operations
	 */
	async mget(keys: string[]): Promise<(StorageValue | null)[]> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.mgetRedis(keys);
			}
			return this.mgetMemory(keys);
		} catch (error) {
			logger.cacheError(StorageOperation.MGET, keys.join(','), {
				error: getErrorMessage(error),
			});
			return keys.map(() => null);
		}
	}

	/**
	 * Sets multiple values in cache
	 *
	 * @param keyValues Array of key-value pairs with optional TTL
	 * @returns Promise<void> Operation completion
	 * @description Stores multiple values efficiently using batch operations
	 */
	async mset(keyValues: CacheEntry[]): Promise<void> {
		try {
			if (this.useRedis && this.redisClient) {
				await this.msetRedis(keyValues);
			} else {
				this.msetMemory(keyValues);
			}

			logger.cacheSet('multiple', {
				keysCount: keyValues.length,
			});
		} catch (error) {
			logger.cacheError(StorageOperation.MSET, 'multiple', {
				error: getErrorMessage(error),
				keysCount: keyValues.length,
			});
		}
	}

	/**
	 * Increments a numeric value in cache
	 *
	 * @param key The cache key to increment
	 * @param amount Amount to increment (defaults to 1)
	 * @returns Promise<number> New value after increment
	 * @description Atomically increments numeric values in cache
	 */
	async increment(key: string, amount: number = 1): Promise<number> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.incrementRedis(key, amount);
			} else {
				return this.incrementMemory(key, amount);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.INCREMENT, key, {
				error: getErrorMessage(error),
			});
			return 0;
		}
	}

	/**
	 * Delete a value from cache
	 * @param key Cache key
	 * @returns True if key was found and deleted
	 */
	async delete(key: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			let deleted = false;

			if (this.useRedis && this.redisClient) {
				deleted = await this.deleteRedis(prefixedKey);
			} else {
				deleted = this.deleteMemory(prefixedKey);
			}

			logger.cacheDelete(key, {
				deleted: deleted ? 1 : 0,
			});

			return createTimedResult<void>(
				deleted,
				undefined,
				deleted ? undefined : 'Key not found',
				startTime,
				StorageType.CACHE
			);
		} catch (error) {
			logger.cacheError(StorageOperation.DELETE, key, {
				error: getErrorMessage(error),
			});
			return createTimedResult<void>(false, undefined, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Check if a key exists in cache
	 * @param key Cache key
	 * @returns True if key exists
	 */
	async exists(key: string): Promise<StorageOperationResult<boolean>> {
		const startTime = Date.now();
		try {
			const prefixedKey = this.getPrefixedKey(key);
			let exists = false;

			if (this.useRedis && this.redisClient) {
				exists = await this.existsRedis(prefixedKey);
			} else {
				exists = this.existsMemory(prefixedKey);
			}

			return createTimedResult<boolean>(true, exists, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.EXISTS, key, {
				error: getErrorMessage(error),
			});
			return createTimedResult<boolean>(false, false, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Set TTL for a key
	 * @param key Cache key
	 * @param ttl Time to live in seconds
	 * @returns True if TTL was set successfully
	 */
	async setTTL(key: string, ttl: number): Promise<boolean> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.setTTLRedis(key, ttl);
			} else {
				return this.setTTLMemory(key, ttl);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.SET_TTL, key, {
				error: getErrorMessage(error),
			});
			return false;
		}
	}

	/**
	 * Get TTL for a key
	 * @param key Cache key
	 * @returns TTL in seconds or -1 if key doesn't exist, -2 if key has no TTL
	 */
	async getTTL(key: string): Promise<number> {
		try {
			const prefixedKey = this.getPrefixedKey(key);
			if (this.useRedis && this.redisClient) {
				return await this.getTTLRedis(prefixedKey);
			} else {
				return this.getTTLMemory(prefixedKey);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.GET_TTL, key, {
				error: getErrorMessage(error),
			});
			return -1;
		}
	}

	/**
	 * Clear all cache
	 */
	async clear(): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			if (this.useRedis && this.redisClient) {
				await this.clearRedis();
			} else {
				this.clearMemory();
			}

			logger.systemInfo('Cache cleared', {});

			return createTimedResult<void>(true, undefined, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.CLEAR, '', {
				error: getErrorMessage(error),
			});
			return createTimedResult<void>(false, undefined, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Get cache statistics
	 * @returns Cache statistics
	 */
	async getStats(): Promise<StorageOperationResult<StorageStats>> {
		const startTime = Date.now();
		try {
			let stats: StorageStats;

			if (this.useRedis && this.redisClient) {
				stats = await this.getStatsRedis();
			} else {
				stats = this.getStatsMemory();
			}

			return createTimedResult<StorageStats>(true, stats, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.GET_STATS, '', {
				error: getErrorMessage(error),
			});
			return createTimedResult<StorageStats>(
				false,
				{
					totalItems: 0,
					totalSize: 0,
					expiredItems: 0,
					hitRate: 0,
					averageItemSize: 0,
					utilization: 0,
					opsPerSecond: 0,
					avgResponseTime: 0,
					typeBreakdown: {
						persistent: { items: 0, size: 0 },
						cache: { items: 0, size: 0 },
						hybrid: { items: 0, size: 0 },
					},
				},
				formatStorageError(error),
				startTime,
				StorageType.CACHE
			);
		}
	}

	/**
	 * Invalidate cache by pattern
	 * @param pattern Pattern to match keys
	 * @returns Number of keys invalidated
	 */
	async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			if (this.useRedis && this.redisClient) {
				await this.invalidatePatternRedis(pattern);
			} else {
				this.invalidatePatternMemory(pattern);
			}

			return createTimedResult<void>(true, undefined, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.INVALIDATE, pattern, {
				error: getErrorMessage(error),
			});
			return createTimedResult<void>(false, undefined, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Gets all cache keys
	 *
	 * @returns Promise<StorageOperationResult<string[]>> Operation result with array of cache keys
	 * @description Retrieves all available cache keys for monitoring and management
	 */
	async getKeys(): Promise<StorageOperationResult<string[]>> {
		const startTime = Date.now();
		try {
			let keys: string[] = [];

			if (this.useRedis && this.redisClient) {
				keys = await this.getKeysRedis();
			} else {
				keys = this.getKeysMemory();
			}

			return createTimedResult<string[]>(true, keys, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.GET_KEYS, '', {
				error: getErrorMessage(error),
			});
			return createTimedResult<string[]>(false, [], formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Performs cache cleanup operations
	 *
	 * @param options Cleanup configuration options
	 * @returns Promise<StorageOperationResult<void>> Operation result with timing information
	 * @description Removes expired items from memory cache to free up space with advanced options
	 */
	async cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const cleanupOptions = options ?? {};
			const { removeExpired = true, maxAge, maxSize, dryRun = false, types = [StorageType.CACHE] } = cleanupOptions;

			// Skip if cache type not in cleanup types
			if (!types.includes(StorageType.CACHE)) {
				return createTimedResult<void>(true, undefined, undefined, startTime, StorageType.CACHE);
			}

			const keys = this.getKeysMemory();
			let cleanedCount = 0;
			let totalSize = 0;
			const now = Date.now();

			// Calculate current cache size
			for (const key of keys) {
				const entry = this.memoryCache.get(key);
				if (entry) {
					totalSize += JSON.stringify(entry.value).length;
				}
			}

			// Cleanup logic
			for (const key of keys) {
				const entry = this.memoryCache.get(key);
				if (!entry) continue;

				let shouldRemove = false;

				// Check expired items
				if (removeExpired && entry.expiry && now > entry.expiry) {
					shouldRemove = true;
				}

				// Check max age
				if (maxAge && entry.expiry && now - entry.expiry > maxAge * 1000) {
					shouldRemove = true;
				}

				// Check max size (if specified and cache is too large)
				if (maxSize && totalSize > maxSize) {
					shouldRemove = true;
				}

				if (shouldRemove && !dryRun) {
					this.memoryCache.delete(key);
					cleanedCount++;
					totalSize -= JSON.stringify(entry.value).length;
				}
			}

			logger.cacheInfo('Cache cleanup completed', {
				cleanedCount,
				totalSize,
				dryRun,
				options: JSON.stringify(options),
			});

			return createTimedResult<void>(true, undefined, undefined, startTime, StorageType.CACHE);
		} catch (error) {
			logger.cacheError(StorageOperation.CLEANUP, '', {
				error: getErrorMessage(error),
				options: options ? JSON.stringify(options) : 'none',
			});
			return createTimedResult<void>(false, undefined, formatStorageError(error), startTime, StorageType.CACHE);
		}
	}

	/**
	 * Invalidates cache entries matching a pattern
	 *
	 * @param pattern - The pattern to match for invalidation
	 * @returns Promise<number> Number of invalidated entries
	 * @description Removes cache entries that match the specified pattern
	 */
	async invalidatePattern(pattern: string): Promise<number> {
		try {
			const prefixedPattern = `${this.config.prefix}${pattern}`;
			if (this.useRedis && this.redisClient) {
				return await this.invalidatePatternRedis(prefixedPattern);
			} else {
				return this.invalidatePatternMemory(prefixedPattern);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.INVALIDATE_PATTERN, pattern, {
				error: getErrorMessage(error),
			});
			return 0;
		}
	}

	/**
	 * Memory cache implementation methods
	 * @description Private methods for in-memory cache operations
	 */
	private setMemory(key: string, value: StorageValue, ttl?: number): void {
		const expiry = ttl ? Date.now() + ttl * 1000 : null;
		this.memoryCache.set(key, { value, expiry });
	}

	private getKeysMemory(): string[] {
		return Array.from(this.memoryCache.keys());
	}

	private getMemory(key: string): StorageValue | null {
		const entry = this.memoryCache.get(key);
		if (!entry) return null;

		if (entry.expiry && Date.now() > entry.expiry) {
			this.memoryCache.delete(key);
			return null;
		}

		return entry.value;
	}

	private deleteMemory(key: string): boolean {
		return this.memoryCache.delete(key);
	}

	private existsMemory(key: string): boolean {
		const entry = this.memoryCache.get(key);
		if (!entry) return false;

		if (entry.expiry && Date.now() > entry.expiry) {
			this.memoryCache.delete(key);
			return false;
		}

		return true;
	}

	private setTTLMemory(key: string, ttl: number): boolean {
		const entry = this.memoryCache.get(key);
		if (!entry) return false;

		entry.expiry = Date.now() + ttl * 1000;
		return true;
	}

	private getTTLMemory(key: string): number {
		const entry = this.memoryCache.get(key);
		if (!entry) return -1;
		if (!entry.expiry) return -2;

		const remaining = Math.ceil((entry.expiry - Date.now()) / 1000);
		return remaining > 0 ? remaining : -1;
	}

	private clearMemory(): void {
		this.memoryCache.clear();
	}

	private getStatsMemory(): StorageStats {
		const now = Date.now();
		let validEntries = 0;
		let expiredEntries = 0;
		let totalSize = 0;

		for (const [key, entry] of this.memoryCache.entries()) {
			if (entry.expiry && now > entry.expiry) {
				expiredEntries++;
				this.memoryCache.delete(key);
			} else {
				validEntries++;
				totalSize += JSON.stringify(entry.value).length;
			}
		}

		return {
			totalItems: validEntries,
			totalSize,
			expiredItems: expiredEntries,
			hitRate: 0, // Would need to track hits/misses
			averageItemSize: validEntries > 0 ? totalSize / validEntries : 0,
			utilization: 0, // Would need to track max size
			opsPerSecond: 0, // Would need to track operations over time
			avgResponseTime: 0, // Would need to track response times
			typeBreakdown: {
				persistent: { items: 0, size: 0 },
				cache: { items: validEntries, size: totalSize },
				hybrid: { items: 0, size: 0 },
			},
		};
	}

	private invalidatePatternMemory(pattern: string): number {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'));
		let deletedCount = 0;

		for (const key of this.memoryCache.keys()) {
			if (regex.test(key)) {
				this.memoryCache.delete(key);
				deletedCount++;
			}
		}

		return deletedCount;
	}

	// Memory cache batch operations
	private mgetMemory(keys: string[]): (StorageValue | null)[] {
		return keys.map(key => this.getMemory(key));
	}

	private msetMemory(keyValues: CacheEntry[]): void {
		keyValues.forEach(({ key, value, ttl }) => {
			this.setMemory(key, value, ttl);
		});
	}

	private incrementMemory(key: string, amount: number): number {
		const currentValue = this.getMemory(key);
		if (currentValue === null || currentValue === undefined) {
			this.setMemory(key, amount);
			return amount;
		}
		const current = defaultValidators.number(currentValue) ? (currentValue as number) : 0;
		const newValue = current + amount;
		this.setMemory(key, newValue);
		return newValue;
	}

	// Redis cache methods
	private async setRedis(key: string, value: StorageValue, ttl?: number): Promise<void> {
		const serialized = JSON.stringify(value);
		if (ttl) {
			await this.redisClient?.setex(key, ttl, serialized);
		} else {
			await this.redisClient?.set(key, serialized);
		}
	}

	private async getRedis(key: string): Promise<StorageValue | null> {
		if (!this.redisClient) return null;
		const data = await this.redisClient.get(key);
		return data ? JSON.parse(data) : null;
	}

	private async deleteRedis(key: string): Promise<boolean> {
		if (!this.redisClient) return false;
		const result = await this.redisClient.del(key);
		return result === 1;
	}

	private async existsRedis(key: string): Promise<boolean> {
		if (!this.redisClient) return false;
		const result = await this.redisClient.exists(key);
		return result === 1;
	}

	private async setTTLRedis(key: string, ttl: number): Promise<boolean> {
		if (!this.redisClient) return false;
		const result = await this.redisClient.expire(key, ttl);
		return result === 1;
	}

	private async getTTLRedis(key: string): Promise<number> {
		if (!this.redisClient) return -2;
		return await this.redisClient.ttl(key);
	}

	private async clearRedis(): Promise<void> {
		if (!this.redisClient) return;
		await this.redisClient.flushdb();
	}

	private async getKeysRedis(): Promise<string[]> {
		const pattern = `${this.config.prefix}*`;
		const keys = await scanKeys(this.redisClient, pattern);

		// Remove prefix from keys
		return keys.map(key => key.replace(this.config.prefix, ''));
	}

	private async getStatsRedis(): Promise<StorageStats> {
		if (!this.redisClient) {
			return {
				totalItems: 0,
				totalSize: 0,
				expiredItems: 0,
				hitRate: 0,
				averageItemSize: 0,
				utilization: 0,
				opsPerSecond: 0,
				avgResponseTime: 0,
				typeBreakdown: {
					persistent: { items: 0, size: 0 },
					cache: { items: 0, size: 0 },
					hybrid: { items: 0, size: 0 },
				},
			};
		}

		const pattern = `${this.config.prefix}*`;
		const keys = await scanKeys(this.redisClient, pattern);

		const totalSize = keys.length * 100; // Approximate size

		return {
			totalItems: keys.length,
			totalSize,
			expiredItems: 0, // Redis handles expiration automatically
			hitRate: 0, // Would need to track hits/misses
			averageItemSize: keys.length > 0 ? totalSize / keys.length : 0,
			utilization: 0, // Would need to track max size
			opsPerSecond: 0, // Would need to track operations over time
			avgResponseTime: 0, // Would need to track response times
			typeBreakdown: {
				persistent: { items: 0, size: 0 },
				cache: { items: keys.length, size: totalSize },
				hybrid: { items: 0, size: 0 },
			},
		};
	}

	private async invalidatePatternRedis(pattern: string): Promise<number> {
		return deleteKeysByPattern(this.redisClient, pattern);
	}

	// Redis cache batch operations
	private async mgetRedis(keys: string[]): Promise<(StorageValue | null)[]> {
		if (!this.redisClient) return keys.map(() => null);
		const values = await this.redisClient.mget(keys);
		return values.map(value => (value ? JSON.parse(value) : null));
	}

	private async msetRedis(keyValues: CacheEntry[]): Promise<void> {
		if (!this.redisClient) return;
		const pipeline = this.redisClient.pipeline();

		keyValues.forEach(({ key, value, ttl }) => {
			const serialized = JSON.stringify(value);
			if (ttl) {
				pipeline.setex(key, ttl, serialized);
			} else {
				pipeline.set(key, serialized);
			}
		});

		await pipeline.exec();
	}

	private async incrementRedis(key: string, amount: number): Promise<number> {
		if (!this.redisClient) return 0;
		return await this.redisClient.incrby(key, amount);
	}

	/**
	 * Cleanup on module destroy
	 */
	/**
	 * Invalidate cache when storage data changes
	 * @param pattern - Pattern to match cache keys for invalidation
	 */
	async invalidateOnStorageChange(pattern: string): Promise<void> {
		try {
			await this.invalidatePattern(pattern);
			logger.cacheInfo('Cache invalidated due to storage change', {
				pattern,
			});
		} catch (error) {
			logger.cacheError(StorageOperation.INVALIDATE_ON_STORAGE_CHANGE, pattern, {
				error: getErrorMessage(error),
			});
		}
	}

	onModuleDestroy() {
		try {
			this.clearMemory();
			logger.systemInfo('Cache service destroyed', {});
		} catch (error) {
			logger.systemError('Failed to destroy cache service', {
				error: getErrorMessage(error),
			});
		}
	}

	private normalizeStorageValue(value: unknown): StorageValue {
		if (value === undefined) {
			return null;
		}
		if (
			value === null ||
			defaultValidators.string(value) ||
			defaultValidators.number(value) ||
			defaultValidators.boolean(value) ||
			value instanceof Date ||
			Array.isArray(value) ||
			isRecord(value)
		) {
			return value;
		}
		return String(value);
	}

	/**
	 * Get string value from cache with automatic runtime validation
	 * @param key - Cache key
	 * @returns Storage operation result with validated string
	 */
	async getString(key: string): Promise<StorageOperationResult<string | null>> {
		return this.get(key, defaultValidators.string);
	}

	/**
	 * Get number value from cache with automatic runtime validation
	 * @param key - Cache key
	 * @returns Storage operation result with validated number
	 */
	async getNumber(key: string): Promise<StorageOperationResult<number | null>> {
		return this.get(key, defaultValidators.number);
	}

	/**
	 * Get boolean value from cache with automatic runtime validation
	 * @param key - Cache key
	 * @returns Storage operation result with validated boolean
	 */
	async getBoolean(key: string): Promise<StorageOperationResult<boolean | null>> {
		return this.get(key, defaultValidators.boolean);
	}

	/**
	 * Get date value from cache with automatic runtime validation
	 * @param key - Cache key
	 * @returns Storage operation result with validated Date (converts ISO strings to Date objects)
	 */
	async getDate(key: string): Promise<StorageOperationResult<Date | null>> {
		const startTime = Date.now();
		const result = await this.get(key, defaultValidators.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return createTimedResult<Date | null>(true, new Date(result.data), undefined, startTime, StorageType.CACHE);
			}
			// result.data is already a Date (validated by defaultValidators.date)
			if (result.data instanceof Date) {
				return createTimedResult<Date | null>(true, result.data, undefined, startTime, StorageType.CACHE);
			}
		}
		return createTimedResult<Date | null>(false, null, result.error, startTime, StorageType.CACHE);
	}
}
