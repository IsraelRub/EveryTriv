import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { StorageType, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS, VALIDATORS } from '@shared/constants';
import type {
	StorageService as IStorageService,
	StorageCleanupOptions,
	StorageConfig,
	StorageItemMetadata,
	StorageMetrics,
	StorageOperationResult,
	StorageStats,
	StorageValue,
	TypeGuard,
	UserProgressData,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isUserProgressData } from '@shared/utils/domain';
import { createTimedResult } from '@shared/utils/infrastructure/storage.utils';

import { SERVER_STORAGE_CONFIG, StorageOperation } from '@internal/constants';

import { StorageMetricsTracker } from '../../services';
import { deleteKeysByPattern, scanKeys } from '../../utils';
import { StorageUtils } from './utils';

@Injectable()
export class StorageService implements IStorageService {
	protected config: StorageConfig;
	protected metadata = new Map<string, StorageItemMetadata>();
	private redisClient: Redis;

	constructor(redisClient: Redis, config: Partial<StorageConfig> = {}) {
		this.config = {
			...SERVER_STORAGE_CONFIG,
			...config,
			type: config.type ?? StorageType.PERSISTENT,
		};
		this.redisClient = redisClient;
	}

	protected createTimedResult<T>(
		success: boolean,
		data?: T,
		error?: string,
		startTime?: number,
		storageType: StorageType = this.config.type
	): StorageOperationResult<T> {
		return createTimedResult(success, data, error, startTime, storageType);
	}

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
		await this.set(key, progressData, TIME_DURATIONS_SECONDS.TWO_HOURS);
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
			await this.redisClient.setex(
				prefixedKey,
				ttl ?? this.config.defaultTtl ?? SERVER_STORAGE_CONFIG.defaultTtl,
				serialized
			);

			this.updateMetadata(key, serialized.length, ttl);
			this.trackOperationWithTiming(StorageOperation.SET, startTime, true, StorageType.PERSISTENT, serialized.length);

			// Cache invalidation handled by CacheService independently

			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.SET, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(`Failed to set item: ${getErrorMessage(error)}`, this.config.type);
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
				`Failed to get item: ${getErrorMessage(error)}`,
				this.config.type
			);
		}
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
		const result = await this.get(key, VALIDATORS.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return StorageUtils.createSuccessResult<Date | null>(new Date(result.data), this.config.type);
			}
			// result.data is already a Date (validated by VALIDATORS.date)
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
			return StorageUtils.createErrorResult<void>(`Failed to delete item: ${getErrorMessage(error)}`, this.config.type);
		}
	}

	async exists(key: string): Promise<StorageOperationResult<boolean>> {
		const startTime = Date.now();
		try {
			const prefixedKey = StorageUtils.getPrefixedKey(key, this.config.prefix);
			const result = await this.redisClient.exists(prefixedKey);

			this.trackOperationWithTiming('exists', startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<boolean>(result === 1, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.EXISTS, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<boolean>(
				`Failed to check existence: ${getErrorMessage(error)}`,
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
				`Failed to clear storage: ${getErrorMessage(error)}`,
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

			this.trackOperationWithTiming('getKeys', startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<string[]>(unprefixedKeys, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming('getKeys', startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<string[]>(
				`Failed to get keys: ${getErrorMessage(error)}`,
				this.config.type
			);
		}
	}

	// Default implementations

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

			this.trackOperationWithTiming('invalidate', startTime, true, StorageType.PERSISTENT);
			return StorageUtils.createSuccessResult<void>(undefined, this.config.type);
		} catch (error) {
			this.trackOperationWithTiming(StorageOperation.INVALIDATE, startTime, false, StorageType.PERSISTENT);
			return StorageUtils.createErrorResult<void>(
				`Failed to invalidate keys: ${getErrorMessage(error)}`,
				this.config.type
			);
		}
	}

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

			const averageSize = totalItems > 0 ? totalSize / totalItems : 0;
			const utilization = this.config.maxSize ? (totalSize / this.config.maxSize) * 100 : 0;

			return StorageUtils.createSuccessResult<StorageStats>(
				{
					totalItems,
					totalSize,
					itemsByType: {},
					averageSize,
					expiredItems,
					hitRate: 0, // Would need to track hits/misses
					utilization,
					opsPerSecond: 0, // Would need to track operations over time
					avgResponseTime: 0, // Would need to track response times
					storageType: this.config.type,
					typeBreakdown: {
						[StorageType.PERSISTENT]: { items: totalItems, size: totalSize },
						[StorageType.CACHE]: { items: 0, size: 0 },
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
				if (metadata?.createdAt) {
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
