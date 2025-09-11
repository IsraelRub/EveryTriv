/**
 * Base Storage Service
 * Shared between client and server implementations
 *
 * @module BaseStorageService
 * @description Abstract storage service for client and server implementations
 * @used_by server: server/src/shared/modules/storage/storage.service.ts (ServerStorageService), client: client/src/services/storage/storage.service.ts (ClientStorageService)
 */
import {
	CacheData,
	CacheStorage,
	formatTime,
	getCurrentTimestamp,
	StorageCleanupOptions,
	StorageConfig,
	StorageConfigFactory,
	StorageItemMetadata,
	StorageMetrics,
	StorageMetricsTracker,
	StorageOperationResult,
	StorageStats,
	StorageUtils,
	UnifiedStorageService,
	UserProgressData,
} from '../index';

/**
 * Base storage service class
 * @abstract BaseStorageService
 * @description Abstract base class for persistent storage implementations (not caching)
 * @note This is for PERSISTENT storage only. For caching, use CacheService instead.
 * @used_by server: server/src/shared/modules/storage/storage.service.ts (ServerStorageService extends), client: client/src/services/storage/storage.service.ts (ClientStorageService extends)
 */
export abstract class BaseStorageService implements UnifiedStorageService {
	protected config: StorageConfig;
	protected metadata = new Map<string, StorageItemMetadata>();

	constructor(config: Partial<StorageConfig> = {}) {
		this.config = StorageConfigFactory.createPersistentConfig(config);
	}

	protected getPrefixedKey(key: string): string {
		return StorageUtils.getPrefixedKey(key, this.config.prefix);
	}

	protected serialize<T>(value: T): string {
		return StorageUtils.serialize(value);
	}

	protected deserialize<T>(data: string): T {
		return StorageUtils.deserialize(data);
	}

	protected createSuccessResult<T>(data?: T): StorageOperationResult<T> {
		return StorageUtils.createSuccessResult(data, this.config.type);
	}

	protected createErrorResult<T>(error: string): StorageOperationResult<T> {
		return StorageUtils.createErrorResult(error, this.config.type);
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
		storageType?: 'persistent' | 'cache' | 'hybrid'
	): StorageOperationResult<T> {
		return StorageUtils.createTimedResult(success, data, error, startTime, storageType || this.config.type);
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
		storageType: 'persistent' | 'cache' | 'hybrid' = this.config.type,
		size?: number
	): void {
		StorageMetricsTracker.trackOperation(operation, startTime, success, storageType, size, this.config.enableMetrics);
	}

	/**
	 * Handles error with consistent formatting using shared utility
	 *
	 * @param error - The error to format
	 * @returns string Formatted error message
	 * @description Provides consistent error formatting across storage operations
	 */
	protected formatError(error: unknown): string {
		return StorageUtils.formatError(error);
	}

	protected updateMetadata(key: string, size: number, ttl?: number): void {
		const now = new Date();
		const existing = this.metadata.get(key);
		this.metadata.set(key, {
			created_at: existing?.created_at || now,
			updated_at: now,
			lastAccessed: now,
			size,
			ttl,
			isExpired: false,
			storageType: this.config.type,
			accessCount: (existing?.accessCount || 0) + 1,
			// Enhanced metadata tracking
			// lastModified: getCurrentTimestamp(),
			// compressionRatio: this.config.enableCompression ? this.calculateCompressionRatio(size) : 1,
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
			lastSaved: getCurrentTimestamp(),
			version: '1.0',
			compressionRatio: this.config.enableCompression
				? this.calculateCompressionRatio(JSON.stringify(progress).length)
				: 1,
			checksum: this.generateChecksum(JSON.stringify(progress)),
		};
		await this.set(key, progressData, 86400); // 24 hours TTL
	}

	protected async loadUserProgress(userId: string): Promise<UserProgressData | null> {
		const key = `user_progress_${userId}`;
		const result = await this.get<UserProgressData>(key);
		return result.success && result.data ? result.data : null;
	}

	protected async saveCacheData(cacheKey: string, data: CacheData): Promise<void> {
		const key = `cache_${cacheKey}`;
		const ttl = typeof data.ttl === 'number' ? data.ttl : 3600;
		const cacheData = {
			...data,
			cachedAt: getCurrentTimestamp(),
			expiresAt: formatTime(Date.now() + ttl * 1000),
		};
		await this.set(key, cacheData, ttl);
	}

	// Abstract methods to be implemented by subclasses
	abstract set<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	abstract get<T>(key: string): Promise<StorageOperationResult<T | null>>;
	abstract delete(key: string): Promise<StorageOperationResult<void>>;
	abstract exists(key: string): Promise<StorageOperationResult<boolean>>;
	abstract clear(): Promise<StorageOperationResult<void>>;
	abstract getKeys(): Promise<StorageOperationResult<string[]>>;

	/**
	 * Invalidates keys matching pattern (default implementation)
	 *
	 * @param pattern - Pattern to match keys for invalidation
	 * @returns Promise<StorageOperationResult<void>> Operation result
	 * @description Removes all storage entries that match the specified pattern
	 */
	async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
		try {
			const keysResult = await this.getKeys();
			if (!keysResult.success || !keysResult.data) {
				return this.createErrorResult<void>('Failed to get keys for invalidation');
			}

			const matchingKeys = keysResult.data.filter(key => key.includes(pattern));
			const deletePromises = matchingKeys.map(key => this.delete(key));
			await Promise.all(deletePromises);

			return this.createSuccessResult<void>();
		} catch (error) {
			return this.createErrorResult<void>(
				`Failed to invalidate keys: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Gets or sets value with factory function (default implementation)
	 *
	 * @param key - Storage key to retrieve or set
	 * @param factory - Factory function to generate value if not found
	 * @param ttl - Time to live in seconds (optional)
	 * @returns Promise<T> The cached or newly generated value
	 * @description Implements cache-aside pattern with automatic value generation
	 */
	async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const result = await this.get<T>(key);
		if (result.success && result.data !== null) {
			return result.data as T;
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
				return this.createErrorResult<StorageStats>('Failed to get keys for statistics');
			}

			const keys = keysResult.data || [];
			const totalItems = keys.length;
			let totalSize = 0;
			let expiredItems = 0;

			for (const key of keys) {
				const metadata = this.metadata.get(key);
				if (metadata) {
					totalSize += metadata.size || 0;
					if (metadata.isExpired) {
						expiredItems++;
					}
				}
			}

			const averageItemSize = totalItems > 0 ? totalSize / totalItems : 0;
			const utilization = this.config.maxSize ? (totalSize / this.config.maxSize) * 100 : 0;

			return this.createSuccessResult<StorageStats>({
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
			});
		} catch (error) {
			return this.createErrorResult<StorageStats>(
				`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`
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
				return this.createErrorResult<void>('Failed to get keys for cleanup');
			}

			const keys = keysResult.data || [];
			const now = new Date();

			for (const key of keys) {
				const metadata = this.metadata.get(key);
				if (metadata) {
					let shouldRemove = false;

					if (options.removeExpired && metadata.isExpired) {
						shouldRemove = true;
					}

					if (options.maxAge) {
						const age = now.getTime() - metadata.created_at.getTime();
						if (age > options.maxAge * 1000) {
							shouldRemove = true;
						}
					}

					if (options.maxSize && (metadata.size || 0) > options.maxSize) {
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

			return this.createSuccessResult<void>();
		} catch (error) {
			return this.createErrorResult<void>(
				`Failed to cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Legacy methods for backward compatibility
	 * @description Deprecated methods maintained for compatibility with older code
	 */
	/**
	 * @deprecated Use set() instead
	 */
	async setItem<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>> {
		return this.set(key, value, ttl);
	}

	/**
	 * @deprecated Use get() instead
	 */
	async getItem<T>(key: string): Promise<StorageOperationResult<T | null>> {
		return this.get(key);
	}

	/**
	 * @deprecated Use delete() instead
	 */
	async removeItem(key: string): Promise<StorageOperationResult<void>> {
		return this.delete(key);
	}
}

/**
 * Re-export types for convenience
 * @description Exports commonly used types for easier imports
 */
export type {
	CacheStorage,
	StorageCleanupOptions,
	StorageConfig,
	StorageItemMetadata,
	StorageOperationResult,
	StorageStats,
	UnifiedStorageService,
	UserProgressData,
};
