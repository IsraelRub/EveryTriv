/**
 * Cache Strategy Service
 *
 * @module CacheStrategyService
 * @description caching strategy for consistent cache behavior across the system
 * @author EveryTriv Team
 */
import type { StorageService, StorageOperationResult } from '../../types';

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
	async get<T>(
		key: string,
		strategy: 'cache-first' | 'persistent-first' | 'hybrid' = 'cache-first'
	): Promise<StorageOperationResult<T | null>> {
		const startTime = Date.now();
		let success = false;
		let data: T | null = null;
		let error: string | undefined;
		let storageType: 'cache' | 'persistent' | 'hybrid' = 'cache';

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

					// Prefer cache if available
					if (cacheResult.status === 'fulfilled' && 
						cacheResult.value.success && 
						cacheResult.value.data !== null && 
						cacheResult.value.data !== undefined) {
						data = cacheResult.value.data;
						success = true;
						storageType = 'cache';
					} else if (persistentResult.status === 'fulfilled' && 
							   persistentResult.value.success && 
							   persistentResult.value.data !== null && 
							   persistentResult.value.data !== undefined) {
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
				error: err instanceof Error ? err.message : 'Unknown error',
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
	async set<T>(
		key: string,
		value: T,
		ttl?: number,
		strategy: 'cache' | 'persistent' | 'hybrid' = 'hybrid'
	): Promise<StorageOperationResult<void>> {
		const startTime = Date.now();
		let success = false;
		let error: string | undefined;
		let storageType: 'cache' | 'persistent' | 'hybrid' = 'cache';

		try {
			switch (strategy) {
				case 'cache': {
					const result = await this.cacheStorage.set(key, value, ttl);
					success = result.success;
					error = result.error;
					storageType = 'cache';
					break;
				}

				case 'persistent': {
					const result = await this.persistentStorage.set(key, value, ttl);
					success = result.success;
					error = result.error;
					storageType = 'persistent';
					break;
				}

				case 'hybrid': {
					// Store in both cache and persistent storage
					const [cacheResult, persistentResult] = await Promise.allSettled([
						this.cacheStorage.set(key, value, ttl),
						this.persistentStorage.set(key, value, ttl),
					]);

					// Consider successful if at least one succeeds
					success = (cacheResult.status === 'fulfilled' && cacheResult.value.success) ||
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
				error: err instanceof Error ? err.message : 'Unknown error',
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
			success = (cacheResult.status === 'fulfilled' && cacheResult.value.success) ||
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
				error: err instanceof Error ? err.message : 'Unknown error',
				duration: Date.now() - startTime,
				timestamp: new Date(),
			};
		}
	}
}
