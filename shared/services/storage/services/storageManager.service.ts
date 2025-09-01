/**
 * Storage Manager Service
 *
 * @module StorageManagerService
 * @description Unified storage management service that coordinates between persistent storage and caching
 * @used_by server/src/shared/modules/storage/storage.service.ts, server/src/shared/modules/cache/cache.service.ts
 */
import {
	StorageCleanupOptions,
	StorageConfig,
	StorageConfigFactory,
	StorageMetrics,
	StorageMetricsTracker,
	StorageOperationResult,
	StorageStats,
	StorageSyncOptions,
	StorageUtils,
	UnifiedStorageService,
} from '../index';

/**
 * Storage Manager Service
 * @class StorageManagerService
 * @description Coordinates between persistent storage and caching with fallback mechanisms
 */
export class StorageManagerService {
	private persistentStorage: UnifiedStorageService;
	private cacheStorage: UnifiedStorageService;
	private config: StorageConfig;

	constructor(
		persistentStorage: UnifiedStorageService,
		cacheStorage: UnifiedStorageService,
		config: Partial<StorageConfig> = {}
	) {
		this.persistentStorage = persistentStorage;
		this.cacheStorage = cacheStorage;
		this.config = StorageConfigFactory.createHybridConfig(config);
	}

	/**
	 * Create operation result with timing using shared utility
	 * @param success Whether operation was successful
	 * @param data Operation data
	 * @param error Error message
	 * @param startTime Operation start time
	 * @param storageType Storage type
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
	 * @param operation Operation name
	 * @param startTime Operation start time
	 * @param success Whether operation was successful
	 * @param storageType Storage type
	 * @param size Data size in bytes (optional)
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
	 * @param error Error object
	 * @returns Formatted error message
	 */
	private formatError(error: unknown): string {
		return StorageUtils.formatError(error);
	}

	/**
	 * Set value with intelligent storage strategy
	 * @param key Storage key
	 * @param value Value to store
	 * @param ttl Time to live in seconds
	 * @param strategy Storage strategy
	 * @returns Operation result
	 */
	async set<T>(
		key: string,
		value: T,
		ttl?: number,
		strategy: 'persistent' | 'cache' | 'hybrid' = 'hybrid'
	): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		let success = false;
		let error: string | undefined;

		try {
			switch (strategy) {
				case 'persistent': {
					const persistentResult = await this.persistentStorage.set(key, value, ttl);
					success = persistentResult.success;
					error = persistentResult.error;
					break;
				}

				case 'cache': {
					const cacheResult = await this.cacheStorage.set(key, value, ttl);
					success = cacheResult.success;
					error = cacheResult.error;
					break;
				}

				case 'hybrid': {
					// Store in both persistent and cache
					const [persistentResult] = await Promise.allSettled([
						this.persistentStorage.set(key, value, ttl),
						this.cacheStorage.set(key, value, ttl),
					]);

					success = persistentResult.status === 'fulfilled' && persistentResult.value.success;
					if (!success) {
						error = persistentResult.status === 'rejected' ? persistentResult.reason : persistentResult.value.error;
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
	 * @param key Storage key
	 * @param strategy Retrieval strategy
	 * @returns Operation result
	 */
	async get<T>(
		key: string,
		strategy: 'cache-first' | 'persistent-first' | 'hybrid' = 'cache-first'
	): Promise<StorageOperationResult<T | null>> {
		const startTime = Date.now();
		let success = false;
		let data: T | null = null;
		let error: string | undefined;
		let storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid';

		try {
			switch (strategy) {
				case 'cache-first': {
					// Try cache first, then persistent
					const cacheResult = await this.cacheStorage.get<T>(key);
					if (cacheResult.success && cacheResult.data !== null && cacheResult.data !== undefined) {
						data = cacheResult.data;
						success = true;
						storageType = 'cache';
					} else {
						const persistentResult = await this.persistentStorage.get<T>(key);
						if (persistentResult.success && persistentResult.data !== null && persistentResult.data !== undefined) {
							data = persistentResult.data;
							success = true;
							storageType = 'persistent';
							// Cache for future access
							await this.cacheStorage.set(key, data, 300); // 5 min cache
						}
					}
					break;
				}

				case 'persistent-first': {
					// Try persistent first, then cache
					const persistentResult = await this.persistentStorage.get<T>(key);
					if (persistentResult.success && persistentResult.data !== null && persistentResult.data !== undefined) {
						data = persistentResult.data;
						success = true;
						storageType = 'persistent';
					} else {
						const cacheResult = await this.cacheStorage.get<T>(key);
						if (cacheResult.success && cacheResult.data !== null && cacheResult.data !== undefined) {
							data = cacheResult.data;
							success = true;
							storageType = 'cache';
						}
					}
					break;
				}

				case 'hybrid': {
					// Try both simultaneously
					const [persistentResult, cacheResult] = await Promise.allSettled([
						this.persistentStorage.get<T>(key),
						this.cacheStorage.get<T>(key),
					]);

					if (
						persistentResult.status === 'fulfilled' &&
						persistentResult.value.success &&
						persistentResult.value.data !== null &&
						persistentResult.value.data !== undefined
					) {
						data = persistentResult.value.data;
						success = true;
						storageType = 'persistent';
					} else if (
						cacheResult.status === 'fulfilled' &&
						cacheResult.value.success &&
						cacheResult.value.data !== null &&
						cacheResult.value.data !== undefined
					) {
						data = cacheResult.value.data;
						success = true;
						storageType = 'cache';
					}
					break;
				}
			}

			this.trackOperationWithTiming('get', startTime, success, storageType);

			return this.createTimedResult<T | null>(success, data, error, startTime, storageType);
		} catch (err) {
			this.trackOperationWithTiming('get', startTime, false, 'hybrid');

			return this.createTimedResult<T | null>(false, null, this.formatError(err), startTime, 'hybrid');
		}
	}

	/**
	 * Get or set value with factory function
	 * @param key Storage key
	 * @param factory Factory function to generate value
	 * @param ttl Time to live in seconds
	 * @param strategy Storage strategy
	 * @returns Value
	 */
	async getOrSet<T>(
		key: string,
		factory: () => Promise<T>,
		ttl?: number,
		strategy: 'cache' | 'hybrid' = 'hybrid'
	): Promise<T> {
		const startTime = Date.now();

		try {
			// Try to get from cache first
			const cached = await this.get<T>(key, 'cache-first');
			if (cached.success && cached.data !== null && cached.data !== undefined) {
				return cached.data;
			}

			// Generate new value
			const value = await factory();
			await this.set(key, value, ttl, strategy);
			return value;
		} catch (err) {
			this.trackOperationWithTiming('getOrSet', startTime, false, strategy);
			throw err;
		}
	}

	/**
	 * Delete value from all storages
	 * @param key Storage key
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
	 * @param pattern Pattern to match keys
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
	 * @param options Sync options
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
						if (value.success && value.data !== null && value.data !== undefined) {
							await this.cacheStorage.set(key, value.data, 300); // 5 min cache
						}
					}
				}
			}

			if (options.syncToServer) {
				// Sync from cache to persistent (for important data)
				const cacheKeys = await this.cacheStorage.getKeys();
				if (cacheKeys.success && cacheKeys.data) {
					const keysToSync = options.keys || cacheKeys.data.filter(key => key.startsWith('important_'));

					for (const key of keysToSync) {
						const value = await this.cacheStorage.get(key);
						if (value.success && value.data !== null && value.data !== undefined) {
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
	 * Get unified statistics
	 * @returns Combined statistics
	 */
	async getStats(): Promise<StorageOperationResult<{ persistent: StorageStats | null; cache: StorageStats | null }>> {
		try {
			const [persistentStats, cacheStats] = await Promise.all([
				this.persistentStorage.getStats(),
				this.cacheStorage.getStats(),
			]);

			return this.createTimedResult<{ persistent: StorageStats | null; cache: StorageStats | null }>(
				true,
				{
					persistent: persistentStats.success && persistentStats.data ? persistentStats.data : null,
					cache: cacheStats.success && cacheStats.data ? cacheStats.data : null,
					// metrics: this.config.enableMetrics ? metricsService.getMetrics() : null,
				},
				undefined,
				Date.now(),
				'hybrid'
			);
		} catch (err) {
			return this.createTimedResult<{ persistent: StorageStats | null; cache: StorageStats | null }>(
				false,
				undefined,
				this.formatError(err),
				Date.now(),
				'hybrid'
			);
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
			persistentKeys.data.forEach(key => allKeys.add(key));
		}
		if (cacheKeys.success && cacheKeys.data) {
			cacheKeys.data.forEach(key => allKeys.add(key));
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
