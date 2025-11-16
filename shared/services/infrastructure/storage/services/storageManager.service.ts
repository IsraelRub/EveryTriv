/**
 * Storage Manager Service
 *
 * @module StorageManagerService
 * @description Storage management service that coordinates between persistent storage and caching
 * @used_by server/src/internal/modules/storage
 */
import type {
	StorageCleanupOptions,
	StorageConfig,
	StorageMetrics,
	StorageOperationResult,
	StorageService,
	StorageStatsResult,
	StorageSyncOptions,
	StorageValue,
} from '@shared/types';

import { CacheStrategyService } from '../../cache/cache.service';
import { StorageMetricsTracker } from '../base/metrics-tracker';
import { StorageConfigFactory } from '../base/storage-config';
import { StorageUtils } from '../base/storage-utils';

type StorageSetStrategy = 'cache' | 'persistent' | 'hybrid';
type StorageGetStrategy = 'cache-first' | 'persistent-first' | 'hybrid';

/**
 * Storage Manager Service
 * @class StorageManagerService
 * @description Coordinates between persistent storage and caching with fallback mechanisms
 */
export class StorageManagerService {
	private persistentStorage: StorageService;
	private cacheStorage: StorageService;
	private cacheStrategy: CacheStrategyService;
	private config: StorageConfig;

	constructor(persistentStorage: StorageService, cacheStorage: StorageService, config: Partial<StorageConfig> = {}) {
		this.persistentStorage = persistentStorage;
		this.cacheStorage = cacheStorage;
		this.cacheStrategy = new CacheStrategyService(cacheStorage, persistentStorage);
		this.config = StorageConfigFactory.createHybridConfig(config);
	}

	/**
	 * Create operation result with timing using shared utility
	 * @returns Operation result with timing
	 */
	private createTimedResult<T>(
		success: boolean,
		data?: T,
		error?: string,
		startTime?: number,
		storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid'
	): StorageOperationResult<T> {
		return StorageUtils.createTimedResult(success, data, error, startTime, storageType);
	}

	/**
	 * Track operation with timing
	 */
	private trackOperationWithTiming(
		operation: keyof StorageMetrics['operations'],
		startTime: number,
		success: boolean,
		storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid',
		size?: number
	): void {
		StorageMetricsTracker.trackOperation(operation, startTime, success, storageType, size, this.config.enableMetrics);
	}

	/**
	 * Handle error with consistent formatting using shared utility
	 * @returns Formatted error message
	 */
	private formatError(error: unknown): string {
		return StorageUtils.formatError(error);
	}

	/**
	 * Set value with intelligent storage strategy
	 * @returns Operation result
	 */
	async set<T extends StorageValue>(
		key: string,
		value: T,
		ttl?: number,
		strategy: StorageSetStrategy = 'hybrid'
	): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		let success = false;
		let error: string | undefined;

		try {
			switch (strategy) {
				case 'persistent': {
					const persistentResult = await this.persistentStorage.set<T>(key, value, ttl);
					success = persistentResult.success;
					error = persistentResult.error;
					break;
				}

				case 'cache': {
					const cacheResult = await this.cacheStorage.set<T>(key, value, ttl);
					success = cacheResult.success;
					error = cacheResult.error;
					break;
				}

				case 'hybrid': {
					// Store in both persistent and cache
					const [persistentResult, cacheResult] = await Promise.allSettled([
						this.persistentStorage.set<T>(key, value, ttl),
						this.cacheStorage.set<T>(key, value, ttl),
					]);

					const persistentSuccess = persistentResult.status === 'fulfilled' ? persistentResult.value.success : false;
					const cacheSuccess = cacheResult.status === 'fulfilled' ? cacheResult.value.success : false;
					success = persistentSuccess || cacheSuccess;

					if (!success) {
						const persistentError =
							persistentResult.status === 'rejected' ? `${persistentResult.reason}` : persistentResult.value.error;
						const cacheError = cacheResult.status === 'rejected' ? `${cacheResult.reason}` : cacheResult.value.error;
						error = persistentError || cacheError || 'Failed to store in both persistent and cache storage';
					}
					break;
				}
			}

			this.trackOperationWithTiming('set', startTime, success, strategy);

			return this.createTimedResult<void>(success, undefined, error, startTime, strategy);
		} catch (err) {
			this.trackOperationWithTiming('set', startTime, false, strategy);

			return this.createTimedResult<void>(false, undefined, this.formatError(err), startTime, strategy);
		}
	}

	/**
	 * Get value with intelligent fallback strategy
	 * @returns Operation result
	 */
	async get<T extends StorageValue>(
		key: string,
		strategy: StorageGetStrategy = 'cache-first',
		validator?: (value: StorageValue) => value is T
	): Promise<StorageOperationResult<T | null>> {
		const guard: (value: StorageValue) => value is T =
			validator ??
			((value: StorageValue): value is T => {
				void value;
				return true;
			});
		return this.cacheStrategy.get<T>(key, guard, strategy);
	}

	/**
	 * Get or set value with factory function
	 * @returns Value
	 */
	async getOrSet<T extends StorageValue>(
		key: string,
		factory: () => Promise<T>,
		ttl?: number,
		strategy: Extract<StorageSetStrategy, 'cache' | 'hybrid'> = 'hybrid',
		validator?: (value: StorageValue) => value is T
	): Promise<T> {
		const startTime = Date.now();

		try {
			// Try to get from cache first
			const cached = await this.get<T>(key, 'cache-first', validator);
			if (cached.success && cached.data && cached.data !== undefined) {
				return cached.data;
			}

			// Generate new value
			const value = await factory();
			await this.set<T>(key, value, ttl, strategy);
			return value;
		} catch (err) {
			this.trackOperationWithTiming('getOrSet', startTime, false, strategy);
			throw err;
		}
	}

	/**
	 * Delete value from all storages
	 * @returns Operation result
	 */
	async delete(key: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();

		try {
			// Delete from both storages
			const [persistentResult] = await Promise.allSettled([
				this.persistentStorage.delete(key),
				this.cacheStorage.delete(key),
			]);

			const success = persistentResult.status === 'fulfilled' && persistentResult.value.success;
			const error = persistentResult.status === 'rejected' ? persistentResult.reason : persistentResult.value.error;

			this.trackOperationWithTiming('delete', startTime, success, 'hybrid');

			return this.createTimedResult<void>(success, undefined, error, startTime, 'hybrid');
		} catch (err) {
			this.trackOperationWithTiming('delete', startTime, false, 'hybrid');

			return this.createTimedResult<void>(false, undefined, this.formatError(err), startTime, 'hybrid');
		}
	}

	/**
	 * Invalidate cache entries
	 * @returns Operation result
	 */
	async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();

		try {
			const result = await this.cacheStorage.invalidate(pattern);

			this.trackOperationWithTiming('invalidate', startTime, result.success, 'cache');

			return this.createTimedResult<void>(result.success, undefined, result.error, startTime, 'cache');
		} catch (err) {
			this.trackOperationWithTiming('invalidate', startTime, false, 'cache');

			return this.createTimedResult<void>(false, undefined, this.formatError(err), startTime, 'cache');
		}
	}

	/**
	 * Sync data between storages
	 * @returns Sync result
	 */
	async sync(options: StorageSyncOptions = {}): Promise<StorageOperationResult<void>> {
		if (!this.config.enableSync) {
			return this.createTimedResult<void>(false, undefined, 'Sync is disabled', Date.now(), 'hybrid');
		}

		const startTime = Date.now();

		try {
			if (options.syncToClient) {
				// Sync from persistent to cache
				const persistentKeys = await this.persistentStorage.getKeys();
				if (persistentKeys.success && persistentKeys.data) {
					const keysToSync = options.keys || persistentKeys.data;

					for (const key of keysToSync) {
						const value = await this.persistentStorage.get(key);
						if (value.success && value.data && value.data !== undefined) {
							await this.cacheStorage.set(key, value.data, 300); // 5 min cache
						}
					}
				}
			}

			if (options.syncToServer) {
				// Sync from cache to persistent (for important data)
				const cacheKeys = await this.cacheStorage.getKeys();
				if (cacheKeys.success && cacheKeys.data) {
					const keysToSync = options.keys || cacheKeys.data.filter((key: string) => key.startsWith('important_'));

					for (const key of keysToSync) {
						const value = await this.cacheStorage.get(key);
						if (value.success && value.data && value.data !== undefined) {
							await this.persistentStorage.set(key, value.data);
						}
					}
				}
			}

			return this.createTimedResult<void>(true, undefined, undefined, startTime, 'hybrid');
		} catch (err) {
			return this.createTimedResult<void>(false, undefined, this.formatError(err), startTime, 'hybrid');
		}
	}

	/**
	 * Get statistics
	 * @returns Combined statistics
	 */
	async getStats(): Promise<StorageOperationResult<StorageStatsResult>> {
		try {
			const [persistentStats, cacheStats] = await Promise.all([
				this.persistentStorage.getStats(),
				this.cacheStorage.getStats(),
			]);

			return this.createTimedResult<StorageStatsResult>(
				true,
				{
					persistent: persistentStats.success && persistentStats.data ? persistentStats.data : null,
					cache: cacheStats.success && cacheStats.data ? cacheStats.data : null,
				},
				undefined,
				Date.now(),
				'hybrid'
			);
		} catch (err) {
			return this.createTimedResult<StorageStatsResult>(false, undefined, this.formatError(err), Date.now(), 'hybrid');
		}
	}

	// Delegate other methods to appropriate storage
	async exists(key: string): Promise<StorageOperationResult<boolean>> {
		return this.persistentStorage.exists(key);
	}

	async clear(): Promise<StorageOperationResult<void>> {
		const [persistentResult, cacheResult] = await Promise.all([
			this.persistentStorage.clear(),
			this.cacheStorage.clear(),
		]);

		return this.createTimedResult<void>(
			persistentResult.success && cacheResult.success,
			undefined,
			persistentResult.error || cacheResult.error,
			Date.now(),
			'hybrid'
		);
	}

	async getKeys(): Promise<StorageOperationResult<string[]>> {
		const [persistentKeys, cacheKeys] = await Promise.all([
			this.persistentStorage.getKeys(),
			this.cacheStorage.getKeys(),
		]);

		const allKeys = new Set<string>();
		if (persistentKeys.success && persistentKeys.data) {
			persistentKeys.data.forEach((key: string) => allKeys.add(key));
		}
		if (cacheKeys.success && cacheKeys.data) {
			cacheKeys.data.forEach((key: string) => allKeys.add(key));
		}

		return this.createTimedResult<string[]>(true, Array.from(allKeys), undefined, Date.now(), 'hybrid');
	}

	async cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>> {
		const [persistentResult, cacheResult] = await Promise.all([
			this.persistentStorage.cleanup(options),
			this.cacheStorage.cleanup(options),
		]);

		return this.createTimedResult<void>(
			persistentResult.success && cacheResult.success,
			undefined,
			persistentResult.error || cacheResult.error,
			Date.now(),
			'hybrid'
		);
	}
}
