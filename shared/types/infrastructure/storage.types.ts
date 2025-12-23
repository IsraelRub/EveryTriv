/**
 * Storage-related types for EveryTriv
 * Shared between client and server
 *
 * @module StorageTypes
 * @description Storage interfaces and data structures
 */
import { StorageType } from '@shared/constants';

import { BaseCacheEntry, BasicValue, StorageValue } from '../core/data.types';

/**
 * storage service interface
 * @interface StorageService
 * @description interface for both persistent storage and caching
 * @used_by client/src/services/storage/storage.service.ts
 */
export interface StorageService {
	set<T extends StorageValue>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	get(key: string): Promise<StorageOperationResult<StorageValue | null>>;
	get<T extends StorageValue>(
		key: string,
		validator: (value: StorageValue) => value is T
	): Promise<StorageOperationResult<T | null>>;
	delete(key: string): Promise<StorageOperationResult<void>>;
	exists(key: string): Promise<StorageOperationResult<boolean>>;
	clear(): Promise<StorageOperationResult<void>>;
	getKeys(): Promise<StorageOperationResult<string[]>>;
	getStats(): Promise<StorageOperationResult<StorageStats>>;
	cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>>;
	invalidate(pattern: string): Promise<StorageOperationResult<void>>;
	getOrSet<T extends StorageValue>(
		key: string,
		factory: () => Promise<T>,
		ttl: number | undefined,
		validator: (value: StorageValue) => value is T
	): Promise<T>;
	setItem?<T extends StorageValue>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	getItem?<T extends StorageValue>(
		key: string,
		validator: (value: StorageValue) => value is T
	): Promise<StorageOperationResult<T | null>>;
	removeItem?(key: string): Promise<StorageOperationResult<void>>;
}

// StorageType is imported from @shared/constants above
// Re-export here for convenience (it's an enum, not a type)
export { StorageType };

/**
 * Storage configuration interface
 * @interface StorageConfig
 * @description Configuration settings for storage services
 * @used_by shared/services/storage (BaseStorageService), server/src/internal/modules/storage/storage.service.ts (ServerStorageService)
 */
export interface StorageConfig {
	prefix: string;
	defaultTtl?: number;
	enableCompression?: boolean;
	maxSize?: number;
	type: StorageType;
	enableMetrics?: boolean;
	enableSync?: boolean;
}

/**
 * Storage operation result interface
 * @interface StorageOperationResult
 * @description Result of storage operations
 * @used_by shared/services/storage (BaseStorageService)
 */
export interface StorageOperationResult<T = StorageItemMetadata> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: Date;
	duration?: number;
	storageType?: StorageType;
}

/**
 * Storage statistics result interface
 * @interface StorageStatsResult
 * @description Result of storage statistics operations
 * @used_by shared/services/storage (StorageManagerService)
 */
export interface StorageStatsResult {
	persistent: StorageStats | null;
	cache: StorageStats | null;
}

/**
 * Storage item metadata interface
 * @interface StorageItemMetadata
 * @description Metadata for stored items
 * @used_by shared/services/storage (BaseStorageService)
 */
export interface StorageItemMetadata extends BaseCacheEntry {
	size: number;
	ttl?: number;
	isExpired: boolean;
	storageType: StorageType;
	accessCount: number;
	version?: string;
	source?: string;
	tags?: string[];
	customFields?: Record<string, BasicValue>;
	cacheHit?: boolean;
	cacheExpiry?: Date;
	accessTime?: number;
	writeTime?: number;
}

export interface StorageStatsItem {
	items: number;
	size: number;
}

/**
 * Storage statistics interface
 * @interface StorageStats
 * @description Storage service statistics
 * @used_by shared/services/storage (BaseStorageService)
 */
export interface StorageStats {
	totalItems: number;
	totalSize: number;
	expiredItems: number;
	hitRate: number;
	averageItemSize: number;
	utilization: number;
	opsPerSecond: number;
	avgResponseTime: number;
	typeBreakdown: {
		persistent: StorageStatsItem;
		cache: StorageStatsItem;
		hybrid: StorageStatsItem;
	};
}

/**
 * Storage cleanup options interface
 * @interface StorageCleanupOptions
 * @description Options for storage cleanup operations
 * @used_by shared/services/storage (BaseStorageService)
 */
export interface StorageCleanupOptions {
	removeExpired?: boolean;
	maxAge?: number;
	maxSize?: number;
	dryRun?: boolean;
	types?: StorageType[];
}

/**
 * Storage migration options interface
 * @interface StorageMigrationOptions
 * @description Options for storage migration operations
 * @used_by shared/services/storage (BaseStorageService)
 */
export interface StorageMigrationOptions {
	source: StorageConfig;
	target: StorageConfig;
	preserveOriginal?: boolean;
	batchSize?: number;
	validate?: boolean;
}

/**
 * Storage sync options interface
 * @interface StorageSyncOptions
 * @description Options for storage synchronization
 * @used_by shared/services/storage
 */
export interface StorageSyncOptions {
	syncToClient?: boolean;
	syncToServer?: boolean;
	interval?: number;
	keys?: string[];
	syncMetadata?: boolean;
}

export interface StorageMetricsItem {
	operations: number;
	errors: number;
	size: number;
}

export interface StorageMetricsOperation {
	set: number;
	get: number;
	delete: number;
	exists: number;
	clear: number;
	getKeys: number;
	invalidate: number;
	getOrSet: number;
	getStats: number;
	cleanup: number;
}

/**
 * Storage metrics interface
 * @interface StorageMetrics
 * @description metrics for storage operations
 * @used_by shared/services/storage
 */
export interface StorageMetrics {
	operations: StorageMetricsOperation;
	errors: StorageMetricsOperation;
	totalOps: number;
	totalErrors: number;
	performance: {
		avgResponseTime: number;
		opsPerSecond: number;
		hitRate: number;
		missRate: number;
	};
	storageTypes: {
		persistent: StorageMetricsItem;
		cache: StorageMetricsItem;
		hybrid: StorageMetricsItem;
	};
	uptime: {
		ms: number;
		seconds: number;
		minutes: number;
		hours: number;
	};

	middleware?: {
		[middlewareName: string]: {
			requestCount: number;
			totalDuration: number;
			averageDuration: number;
			minDuration: number;
			maxDuration: number;
			errorCount: number;
			lastExecuted: Date;
			lastErrorMessage?: string;
			lastErrorName?: string;
			lastErrorTimestamp?: Date;
		};
	};
}
