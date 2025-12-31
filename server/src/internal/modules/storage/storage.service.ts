/**
 * Server-side persistent storage service using Redis
 *
 * @class ServerStorageService
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
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { CACHE_DURATION, defaultValidators, StorageType, TIME_PERIODS_MS } from '@shared/constants';
import type {
	StorageCleanupOptions,
	StorageConfig,
	StorageItemMetadata,
	StorageMetrics,
	StorageOperationResult,
	StorageService,
	StorageStats,
	StorageValue,
	TypeGuard,
	UserProgressData,
} from '@shared/types';
import { formatStorageError, getErrorMessage } from '@shared/utils';
import { createTimedResult } from '@shared/utils/infrastructure/storage.utils';
import { STORAGE_CONFIG, StorageOperation } from '@internal/constants';
import { isUserProgressData } from '@shared/utils/domain';
import { StorageMetricsTracker } from '../../services';
import { deleteKeysByPattern, scanKeys } from '../../utils';
import { StorageUtils } from './utils';

@Injectable()
export class ServerStorageService implements StorageService {
	protected config: StorageConfig;
	protected metadata = new Map<string, StorageItemMetadata>();
	private redisClient: Redis;

	constructor(redisClient: Redis, config: Partial<StorageConfig> = {}) {
		this.config = {
			...STORAGE_CONFIG,
			...config,
			type: config.type ?? StorageType.PERSISTENT,
		};
		this.redisClient = redisClient;
	}

	/**
	 * Creates operation result with timing using shared utility
	 *
	 * @param success - Whether operation was successful
	 * @param data - Operation data
	 * @param error - Error message
	 * @param startTime - Operation start time
	 * @param storageType - Storage type
	 * @returns StorageOperationResult<T> Operation result with timing information
	 * @description Creates standardized operation results with timing and metadata
	 */
	protected createTimedResult<T>(
		success: boolean,
		data?: T,
		error?: string,
		startTime?: number,
		storageType: StorageType = this.config.type
	): StorageOperationResult<T> {
		return createTimedResult(success, data, error, startTime, storageType);
	}

	/**
	 * Tracks operation with timing and metrics
	 *
	 * @param operation - Operation name to track
	 * @param startTime - Operation start time
	 * @param success - Whether operation was successful
	 * @param storageType - Storage type for categorization
	 * @param size - Data size in bytes (optional)
	 * @description Tracks storage operations for performance monitoring and analytics
	 */
	protected trackOperationWithTiming(
		operation: keyof StorageMetrics['operations'],
		startTime: number,
		success: boolean,
		storageType: StorageType = this.config.type,
		size?: number
	): void {
		StorageMetricsTracker.trackOperation(operation, startTime, success, storageType, size, this.config.enableMetrics);
	}

	protected updateMetadata(key: string, size: number, ttl?: number): void {
		const now = new Date();
		const existing = this.metadata.get(key);
		this.metadata.set(key, {
			createdAt: existing?.createdAt ?? now,
			updatedAt: now,
			lastAccessed: now,
			size,
			ttl,
			isExpired: false,
			storageType: this.config.type,
			accessCount: (existing?.accessCount ?? 0) + 1,
		});
	}

	protected calculateCompressionRatio(originalSize: number): number {
		// Simple compression ratio calculation
		return originalSize > 1024 ? 0.8 : 1;
	}

	protected generateChecksum(data: string): string {
		// Simple checksum generation for data integrity
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return hash.toString(16);
	}

	protected async saveUserProgress(userId: string, progress: UserProgressData): Promise<void> {
		const key = `user_progress_${userId}`;
		const progressData = {
			...progress,
			lastSaved: new Date(),
			version: '1.0',
			compressionRatio: this.config.enableCompression
				? this.calculateCompressionRatio(JSON.stringify(progress).length)
				: 1,
			checksum: this.generateChecksum(JSON.stringify(progress)),
		};
		await this.set(key, progressData, CACHE_DURATION.EXTREME);
	}

	protected async loadUserProgress(userId: string): Promise<UserProgressData | null> {
		const key = `user_progress_${userId}`;
		const result = await this.get(key, isUserProgressData);
		return result.success && result.data ? result.data : null;
	}

	// Redis-specific implementations

	async set(key: string, value: StorageValue, ttl?: number): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = StorageUtils.getPrefixedKey(key, this.config.prefix);
			const serialized = StorageUtils.serialize(value);
			await this.redisClient.setex(prefixedKey, ttl ?? this.config.defaultTtl ?? STORAGE_CONFIG.defaultTtl, serialized);

			this.updateMetadata(key, serialized.length, ttl);
			this.trackOperationWithTiming(StorageOperation.SET, startTime, true, StorageType.PERSISTENT, serialized.length);

			// Cache invalidation handled by CacheService independently

			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.SET, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(`Failed to set item: ${formatStorageError(error)}`, this.config.type);
		}
	}

	async get(key: string): Promise<StorageOperationResult<StorageValue | null>>;
	async get<T extends StorageValue>(
		key: string,
		validator: TypeGuard<T>
	): Promise<StorageOperationResult<T | null>>;
	async get<T extends StorageValue>(
		key: string,
		validator?: TypeGuard<T>
	): Promise<StorageOperationResult<StorageValue | null> | StorageOperationResult<T | null>> {
		const startTime = Date.now();
		try {
			const prefixedKey = StorageUtils.getPrefixedKey(key, this.config.prefix);
			const value = await this.redisClient.get(prefixedKey);

			if (!value) {
				this.trackOperationWithTiming(StorageOperation.GET, startTime, true, StorageType.PERSISTENT);
				return StorageUtils.createSuccessResult<StorageValue | null>(null, this.config.type);
			}

			const deserialized = StorageUtils.deserialize<StorageValue>(value);
			this.updateMetadata(key, value.length);

			this.trackOperationWithTiming(StorageOperation.GET, startTime, true, StorageType.PERSISTENT, value.length);

			if (!validator) {
				return StorageUtils.createSuccessResult<StorageValue | null>(deserialized, this.config.type);
			}

			if (validator(deserialized)) {
				return StorageUtils.createSuccessResult<T | null>(deserialized, this.config.type);
			}

			return StorageUtils.createErrorResult<T | null>('Stored value failed validation', this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.GET, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<T | null>(
				`Failed to get item: ${formatStorageError(error)}`,
				this.config.type
			);
		}
	}

	/**
	 * Get string value from storage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated string
	 */
	async getString(key: string): Promise<StorageOperationResult<string | null>> {
		return this.get(key, defaultValidators.string);
	}

	/**
	 * Get number value from storage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated number
	 */
	async getNumber(key: string): Promise<StorageOperationResult<number | null>> {
		return this.get(key, defaultValidators.number);
	}

	/**
	 * Get boolean value from storage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated boolean
	 */
	async getBoolean(key: string): Promise<StorageOperationResult<boolean | null>> {
		return this.get(key, defaultValidators.boolean);
	}

	/**
	 * Get date value from storage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated Date (converts ISO strings to Date objects)
	 */
	async getDate(key: string): Promise<StorageOperationResult<Date | null>> {
		const result = await this.get(key, defaultValidators.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return StorageUtils.createSuccessResult<Date | null>(new Date(result.data), this.config.type);
			}
			// result.data is already a Date (validated by defaultValidators.date)
			if (result.data instanceof Date) {
				return StorageUtils.createSuccessResult<Date | null>(result.data, this.config.type);
			}
		}
		return StorageUtils.createSuccessResult<Date | null>(null, this.config.type);
	}

	async delete(key: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const prefixedKey = StorageUtils.getPrefixedKey(key, this.config.prefix);
			await this.redisClient.del(prefixedKey);

			this.trackOperationWithTiming(StorageOperation.DELETE, startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.DELETE, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(
				`Failed to delete item: ${formatStorageError(error)}`,
				this.config.type
			);
		}
	}

	async exists(key: string): Promise<StorageOperationResult<boolean>> {
		const startTime = Date.now();
		try {
			const prefixedKey = StorageUtils.getPrefixedKey(key, this.config.prefix);
			const result = await this.redisClient.exists(prefixedKey);

			this.trackOperationWithTiming(StorageOperation.EXISTS, startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<boolean>(result === 1, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.EXISTS, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<boolean>(
				`Failed to check existence: ${formatStorageError(error)}`,
				this.config.type
			);
		}
	}

	async clear(): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const pattern = `${this.config.prefix}*`;
			await deleteKeysByPattern(this.redisClient, pattern);

			this.trackOperationWithTiming(StorageOperation.CLEAR, startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.CLEAR, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(
				`Failed to clear storage: ${formatStorageError(error)}`,
				this.config.type
			);
		}
	}

	async getKeys(): Promise<StorageOperationResult<string[]>> {
		const startTime = Date.now();
		try {
			const pattern = `${this.config.prefix}*`;
			const keys = await scanKeys(this.redisClient, pattern);
			const unprefixedKeys = keys.map((key: string) => key.replace(this.config.prefix, ''));

			this.trackOperationWithTiming(StorageOperation.GET_KEYS, startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<string[]>(unprefixedKeys, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.GET_KEYS, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<string[]>(
				`Failed to get keys: ${formatStorageError(error)}`,
				this.config.type
			);
		}
	}

	// Default implementations

	/**
	 * Invalidates keys matching pattern
	 *
	 * @param pattern - Pattern to match keys for invalidation
	 * @returns Promise<StorageOperationResult<void>> Operation result
	 * @description Removes all storage entries that match the specified pattern
	 */
	async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		try {
			const keysResult = await this.getKeys();
			if (!keysResult.success || !keysResult.data) {
				this.trackOperationWithTiming(StorageOperation.INVALIDATE, startTime, false, StorageType.PERSISTENT);
				return StorageUtils.createErrorResult<void>('Failed to get keys for invalidation', this.config.type);
			}

			const matchingKeys = keysResult.data.filter((key: string) => key.includes(pattern));
			const deletePromises = matchingKeys.map((key: string) => this.delete(key));
			await Promise.all(deletePromises);

			this.trackOperationWithTiming(StorageOperation.INVALIDATE, startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.INVALIDATE, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(
				`Failed to invalidate keys: ${getErrorMessage(error)}`,
				this.config.type
			);
		}
	}

	/**
	 * Gets or sets value with factory function
	 *
	 * @param key - Storage key to retrieve or set
	 * @param factory - Factory function to generate value if not found
	 * @param ttl - Time to live in seconds (optional)
	 * @returns Promise<T> The cached or newly generated value
	 * @description Implements cache-aside pattern with automatic value generation
	 */
	async getOrSet<T extends StorageValue>(
		key: string,
		factory: () => Promise<T>,
		ttl: number | undefined,
		validator: TypeGuard<T>
	): Promise<T> {
		const result = await this.get(key, validator);
		if (result.success && result.data) {
			return result.data;
		}

		const value = await factory();
		await this.set(key, value, ttl);
		return value;
	}

	/**
	 * Gets storage statistics and metrics
	 *
	 * @returns Promise<StorageOperationResult<StorageStats>> Operation result with storage statistics
	 * @description Provides comprehensive storage statistics including item counts, sizes, and utilization
	 */
	async getStats(): Promise<StorageOperationResult<StorageStats>> {
		try {
			const keysResult = await this.getKeys();
			if (!keysResult.success) {
				return StorageUtils.createErrorResult<StorageStats>('Failed to get keys for statistics', this.config.type);
			}

			const keys = keysResult.data ?? [];
			const totalItems = keys.length;
			let totalSize = 0;
			let expiredItems = 0;

			for (const key of keys) {
				const metadata = this.metadata.get(key);
				if (metadata) {
					totalSize += metadata.size ?? 0;
					if (metadata.isExpired) {
						expiredItems++;
					}
				}
			}

			const averageItemSize = totalItems > 0 ? totalSize / totalItems : 0;
			const utilization = this.config.maxSize ? (totalSize / this.config.maxSize) * 100 : 0;

			return StorageUtils.createSuccessResult<StorageStats>(
				{
					totalItems,
					totalSize,
					expiredItems,
					hitRate: 0, // Would need to track hits/misses
					averageItemSize,
					utilization,
					opsPerSecond: 0, // Would need to track operations over time
					avgResponseTime: 0, // Would need to track response times
					typeBreakdown: {
						persistent: { items: totalItems, size: totalSize },
						cache: { items: 0, size: 0 },
						hybrid: { items: 0, size: 0 },
					},
				},
				this.config.type
			);
		} catch (error) {
			return StorageUtils.createErrorResult<StorageStats>(
				`Failed to get stats: ${getErrorMessage(error)}`,
				this.config.type
			);
		}
	}

	/**
	 * Performs storage cleanup operations
	 *
	 * @param options - Cleanup configuration options
	 * @returns Promise<StorageOperationResult<void>> Operation result
	 * @description Removes expired items, old entries, and manages storage size limits
	 */
	async cleanup(options: StorageCleanupOptions = {}): Promise<StorageOperationResult<void>> {
		try {
			const keysResult = await this.getKeys();
			if (!keysResult.success) {
				return StorageUtils.createErrorResult<void>('Failed to get keys for cleanup', this.config.type);
			}

			const keys = keysResult.data ?? [];
			const now = new Date();

			for (const key of keys) {
				const metadata = this.metadata.get(key);
				if (metadata && metadata.createdAt) {
					let shouldRemove = false;

					if (options.removeExpired && metadata.isExpired) {
						shouldRemove = true;
					}

					if (options.maxAge) {
						const age = now.getTime() - metadata.createdAt.getTime();
						if (age > options.maxAge * TIME_PERIODS_MS.SECOND) {
							shouldRemove = true;
						}
					}

					if (options.maxSize && (metadata.size ?? 0) > options.maxSize) {
						shouldRemove = true;
					}

					if (options.types && !options.types.includes(metadata.storageType)) {
						continue;
					}

					if (shouldRemove && !options.dryRun) {
						await this.delete(key);
					}
				}
			}

			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			return StorageUtils.createErrorResult<void>(`Failed to cleanup: ${getErrorMessage(error)}`, this.config.type);
		}
	}
}
