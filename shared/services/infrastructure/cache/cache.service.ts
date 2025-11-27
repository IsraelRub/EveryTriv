/**
 * Cache Strategy Service
 *
 * @module CacheStrategyService
 * @description caching strategy for consistent cache behavior across the system
 * @author EveryTriv Team
 */
import type {
	StorageGetStrategy,
	StorageOperationResult,
	StorageService,
	StorageType,
	StorageValue,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

/**
 * cache service that provides consistent caching behavior
 */
export class CacheStrategyService {
	private cacheStorage: StorageService;
	private persistentStorage: StorageService;

	constructor(cacheStorage: StorageService, persistentStorage: StorageService) {
		this.cacheStorage = cacheStorage;
		this.persistentStorage = persistentStorage;
	}

	/**
	 * Get value with cache strategy
	 * @param key - Cache key
	 * @param strategy - Cache strategy (cache-first, persistent-first, hybrid)
	 * @returns Operation result
	 */
	async get<T extends StorageValue>(
		key: string,
		validator: (value: StorageValue) => value is T,
		strategy: StorageGetStrategy = 'cache-first'
	): Promise<StorageOperationResult<T | null>> {
		const startTime = Date.now();
		let success = false;
		let data: T | null = null;
		let error: string | undefined;
		let storageType: StorageType = 'cache';

		try {
			switch (strategy) {
				case 'cache-first': {
					// Try cache first, then persistent
					const cacheResult = await this.cacheStorage.get<T>(key, validator);
					if (cacheResult.success && cacheResult.data && cacheResult.data !== undefined) {
						data = cacheResult.data;
						success = true;
						storageType = 'cache';
					} else {
						const persistentResult = await this.persistentStorage.get<T>(key, validator);
						if (persistentResult.success && persistentResult.data && persistentResult.data !== undefined) {
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
					const persistentResult = await this.persistentStorage.get<T>(key, validator);
					if (persistentResult.success && persistentResult.data && persistentResult.data !== undefined) {
						data = persistentResult.data;
						success = true;
						storageType = 'persistent';
					} else {
						const cacheResult = await this.cacheStorage.get<T>(key, validator);
						if (cacheResult.success && cacheResult.data && cacheResult.data !== undefined) {
							data = cacheResult.data;
							success = true;
							storageType = 'cache';
						}
					}
					break;
				}

				case 'both': {
					// Try both simultaneously
					const [persistentResult, cacheResult] = await Promise.allSettled([
						this.persistentStorage.get<T>(key, validator),
						this.cacheStorage.get<T>(key, validator),
					]);

					// Prefer cache if available
					if (
						cacheResult.status === 'fulfilled' &&
						cacheResult.value.success &&
						cacheResult.value.data &&
						cacheResult.value.data !== undefined
					) {
						data = cacheResult.value.data;
						success = true;
						storageType = 'cache';
					} else if (
						persistentResult.status === 'fulfilled' &&
						persistentResult.value.success &&
						persistentResult.value.data &&
						persistentResult.value.data !== undefined
					) {
						data = persistentResult.value.data;
						success = true;
						storageType = 'persistent';
					}
					break;
				}
			}

			return {
				success,
				data,
				error,
				duration: Date.now() - startTime,
				storageType,
				timestamp: new Date(),
			};
		} catch (err) {
			return {
				success: false,
				data: null,
				error: getErrorMessage(err),
				duration: Date.now() - startTime,
				storageType: 'cache',
				timestamp: new Date(),
			};
		}
	}

	/**
	 * Set value with cache strategy
	 * @param key - Cache key
	 * @param value - Value to cache
	 * @param ttl - Time to live in seconds
	 * @param strategy - Storage strategy (cache, persistent, hybrid)
	 * @returns Operation result
	 */
	async set<T extends StorageValue>(
		key: string,
		value: T,
		ttl?: number,
		strategy: StorageType = 'hybrid'
	): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		let success = false;
		let error: string | undefined;
		let storageType: StorageType = 'cache';

		try {
			switch (strategy) {
				case 'cache': {
					const result = await this.cacheStorage.set<T>(key, value, ttl);
					success = result.success;
					error = result.error;
					storageType = 'cache';
					break;
				}

				case 'persistent': {
					const result = await this.persistentStorage.set<T>(key, value, ttl);
					success = result.success;
					error = result.error;
					storageType = 'persistent';
					break;
				}

				case 'hybrid': {
					// Store in both cache and persistent storage
					const [cacheResult, persistentResult] = await Promise.allSettled([
						this.cacheStorage.set<T>(key, value, ttl),
						this.persistentStorage.set<T>(key, value, ttl),
					]);

					// Consider successful if at least one succeeds
					success =
						(cacheResult.status === 'fulfilled' && cacheResult.value.success) ||
						(persistentResult.status === 'fulfilled' && persistentResult.value.success);

					if (!success) {
						error = 'Failed to store in both cache and persistent storage';
					}
					storageType = 'hybrid';
					break;
				}
			}

			return {
				success,
				error,
				duration: Date.now() - startTime,
				storageType,
				timestamp: new Date(),
			};
		} catch (err) {
			return {
				success: false,
				error: getErrorMessage(err),
				duration: Date.now() - startTime,
				storageType: 'cache',
				timestamp: new Date(),
			};
		}
	}

	/**
	 * Delete value from both cache and persistent storage
	 * @param key - Cache key
	 * @returns Operation result
	 */
	async delete(key: string): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		let success = false;
		let error: string | undefined;

		try {
			// Delete from both storage types
			const [cacheResult, persistentResult] = await Promise.allSettled([
				this.cacheStorage.delete(key),
				this.persistentStorage.delete(key),
			]);

			// Consider successful if at least one succeeds
			success =
				(cacheResult.status === 'fulfilled' && cacheResult.value.success) ||
				(persistentResult.status === 'fulfilled' && persistentResult.value.success);

			if (!success) {
				error = 'Failed to delete from both cache and persistent storage';
			}

			return {
				success,
				error,
				duration: Date.now() - startTime,
				timestamp: new Date(),
			};
		} catch (err) {
			return {
				success: false,
				error: getErrorMessage(err),
				duration: Date.now() - startTime,
				timestamp: new Date(),
			};
		}
	}
}
