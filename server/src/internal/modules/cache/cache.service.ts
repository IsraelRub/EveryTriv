import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { StorageType, TIME_PERIODS_MS, VALIDATORS } from '@shared/constants';
import type {
	StorageCleanupOptions,
	StorageConfig,
	StorageOperationResult,
	StorageService,
	StorageStats,
	StorageValue,
	TypeGuard,
} from '@shared/types';
import { createTimedResult, getErrorMessage } from '@shared/utils';

import { CACHE_CONFIG, StorageOperation } from '@internal/constants';
import { serverLogger as logger } from '@internal/services';

import { deleteKeysByPattern, scanKeys } from '../../utils';

function createTypeBreakdown(
	cacheItems: number = 0,
	cacheSize: number = 0
): Record<StorageType, { items: number; size: number }> {
	return {
		[StorageType.PERSISTENT]: { items: 0, size: 0 },
		[StorageType.CACHE]: { items: cacheItems, size: cacheSize },
	};
}

function isValidCacheEntry(entry: unknown): entry is { key: string; value: StorageValue; ttl?: number } {
	if (typeof entry !== 'object' || entry === null) {
		return false;
	}
	const obj = entry;
	const hasKey = 'key' in obj && typeof Reflect.get(obj, 'key') === 'string';
	const hasValue = 'value' in obj;
	const hasTtl = 'ttl' in obj;
	const ttlValue = hasTtl ? Reflect.get(obj, 'ttl') : undefined;
	const isValidTtl = !hasTtl || ttlValue === undefined || (typeof ttlValue === 'number' && ttlValue >= 0);

	return hasKey && hasValue && isValidTtl;
}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<void>(false, undefined, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

	async get(key: string): Promise<StorageOperationResult<StorageValue | null>>;
	async get<T extends StorageValue>(key: string, validator: TypeGuard<T>): Promise<StorageOperationResult<T | null>>;
	async get<T extends StorageValue>(
		key: string,
		validator?: TypeGuard<T>
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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<T | null>(false, null, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

	async getOrSet<T extends StorageValue>(
		key: string,
		factory: () => Promise<T>,
		ttl: number | undefined,
		validator: TypeGuard<T>
	): Promise<T> {
		try {
			const cached = await this.get(key, validator);
			if (cached.success && cached.data) {
				return cached.data;
			}

			const value = await factory();
			await this.set(key, value, ttl);
			return value;
		} catch (error) {
			logger.cacheError(StorageOperation.GET_OR_SET, key, {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async mget(keys: string[]): Promise<(StorageValue | null)[]> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.mgetRedis(keys);
			}
			return this.mgetMemory(keys);
		} catch (error) {
			logger.cacheError(StorageOperation.MGET, keys.join(','), {
				errorInfo: { message: getErrorMessage(error) },
			});
			return keys.map(() => null);
		}
	}

	async mset(keyValues: import('@shared/types').CacheEntry[]): Promise<void> {
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
				errorInfo: { message: getErrorMessage(error) },
				keysCount: keyValues.length,
			});
		}
	}

	async increment(key: string, amount: number = 1): Promise<number> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.incrementRedis(key, amount);
			} else {
				return this.incrementMemory(key, amount);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.INCREMENT, key, {
				errorInfo: { message: getErrorMessage(error) },
			});
			return 0;
		}
	}

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
				deletedCount: deleted ? 1 : 0,
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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<void>(false, undefined, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<boolean>(false, false, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

	async setTTL(key: string, ttl: number): Promise<boolean> {
		try {
			if (this.useRedis && this.redisClient) {
				return await this.setTTLRedis(key, ttl);
			} else {
				return this.setTTLMemory(key, ttl);
			}
		} catch (error) {
			logger.cacheError(StorageOperation.SET_TTL, key, {
				errorInfo: { message: getErrorMessage(error) },
			});
			return false;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return -1;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<void>(false, undefined, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<StorageStats>(
				false,
				{
					totalItems: 0,
					totalSize: 0,
					itemsByType: {},
					averageSize: 0,
					expiredItems: 0,
					hitRate: 0,
					utilization: 0,
					opsPerSecond: 0,
					avgResponseTime: 0,
					storageType: StorageType.CACHE,
					typeBreakdown: createTypeBreakdown(),
				},
				getErrorMessage(error),
				startTime,
				StorageType.CACHE
			);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<void>(false, undefined, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return createTimedResult<string[]>(false, [], getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

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
				if (maxAge && entry.expiry && now - entry.expiry > maxAge * TIME_PERIODS_MS.SECOND) {
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
				errorInfo: { message: getErrorMessage(error) },
				options: options ? JSON.stringify(options) : 'none',
			});
			return createTimedResult<void>(false, undefined, getErrorMessage(error), startTime, StorageType.CACHE);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			return 0;
		}
	}

	private setMemory(key: string, value: StorageValue, ttl?: number): void {
		const expiry = ttl ? Date.now() + ttl * TIME_PERIODS_MS.SECOND : null;
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

		entry.expiry = Date.now() + ttl * TIME_PERIODS_MS.SECOND;
		return true;
	}

	private getTTLMemory(key: string): number {
		const entry = this.memoryCache.get(key);
		if (!entry) return -1;
		if (!entry.expiry) return -2;

		const remaining = Math.ceil((entry.expiry - Date.now()) / TIME_PERIODS_MS.SECOND);
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

		const averageSize = validEntries > 0 ? totalSize / validEntries : 0;
		return {
			totalItems: validEntries,
			totalSize,
			itemsByType: {},
			averageSize,
			expiredItems: expiredEntries,
			hitRate: 0, // Would need to track hits/misses
			utilization: 0, // Would need to track max size
			opsPerSecond: 0, // Would need to track operations over time
			avgResponseTime: 0, // Would need to track response times
			storageType: StorageType.CACHE,
			typeBreakdown: createTypeBreakdown(validEntries, totalSize),
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

	private msetMemory(keyValues: import('@shared/types').CacheEntry[]): void {
		keyValues.forEach(entry => {
			if (!isValidCacheEntry(entry)) {
				logger.cacheError(StorageOperation.MSET, 'invalid entry', {
					errorInfo: { message: 'Invalid cache entry structure' },
				});
				return;
			}
			const key = entry.key;
			const value = entry.value;
			const ttl = entry.ttl;
			this.setMemory(key, value, ttl);
		});
	}

	private incrementMemory(key: string, amount: number): number {
		const currentValue = this.getMemory(key);
		if (currentValue === null || currentValue === undefined) {
			this.setMemory(key, amount);
			return amount;
		}
		const current = VALIDATORS.number(currentValue) ? currentValue : 0;
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
				itemsByType: {},
				averageSize: 0,
				expiredItems: 0,
				hitRate: 0,
				utilization: 0,
				opsPerSecond: 0,
				avgResponseTime: 0,
				storageType: StorageType.CACHE,
				typeBreakdown: createTypeBreakdown(),
			};
		}

		const pattern = `${this.config.prefix}*`;
		const keys = await scanKeys(this.redisClient, pattern);

		const totalSize = keys.length * 100; // Approximate size

		const averageSize = keys.length > 0 ? totalSize / keys.length : 0;
		return {
			totalItems: keys.length,
			totalSize,
			itemsByType: {},
			averageSize,
			expiredItems: 0, // Redis handles expiration automatically
			hitRate: 0, // Would need to track hits/misses
			utilization: 0, // Would need to track max size
			opsPerSecond: 0, // Would need to track operations over time
			avgResponseTime: 0, // Would need to track response times
			storageType: StorageType.CACHE,
			typeBreakdown: createTypeBreakdown(keys.length, totalSize),
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

	private async msetRedis(keyValues: import('@shared/types').CacheEntry[]): Promise<void> {
		if (!this.redisClient) return;
		const pipeline = this.redisClient.pipeline();

		keyValues.forEach(entry => {
			if (!isValidCacheEntry(entry)) {
				logger.cacheError(StorageOperation.MSET, 'invalid entry', {
					errorInfo: { message: 'Invalid cache entry structure' },
				});
				return;
			}
			const key = entry.key;
			const value = entry.value;
			const ttl = entry.ttl;
			const serialized = JSON.stringify(value);
			if (ttl && typeof ttl === 'number') {
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

	onModuleDestroy() {
		try {
			this.clearMemory();
			logger.systemInfo('Cache service destroyed', {});
		} catch (error) {
			logger.systemError('Failed to destroy cache service', {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}

	private normalizeStorageValue(value: unknown): StorageValue {
		if (value === undefined) {
			return null;
		}
		if (
			value === null ||
			VALIDATORS.string(value) ||
			VALIDATORS.number(value) ||
			VALIDATORS.boolean(value) ||
			value instanceof Date ||
			(typeof value === 'object' && value !== null)
		) {
			return value;
		}
		return String(value);
	}

	async getString(key: string): Promise<StorageOperationResult<string | null>> {
		return this.get(key, VALIDATORS.string);
	}

	async getNumber(key: string): Promise<StorageOperationResult<number | null>> {
		return this.get(key, VALIDATORS.number);
	}

	async getBoolean(key: string): Promise<StorageOperationResult<boolean | null>> {
		return this.get(key, VALIDATORS.boolean);
	}

	async getDate(key: string): Promise<StorageOperationResult<Date | null>> {
		const startTime = Date.now();
		const result = await this.get(key, VALIDATORS.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return createTimedResult<Date | null>(true, new Date(result.data), undefined, startTime, StorageType.CACHE);
			}
			// result.data is already a Date (validated by VALIDATORS.date)
			if (result.data instanceof Date) {
				return createTimedResult<Date | null>(true, result.data, undefined, startTime, StorageType.CACHE);
			}
		}
		return createTimedResult<Date | null>(false, null, result.error, startTime, StorageType.CACHE);
	}
}
