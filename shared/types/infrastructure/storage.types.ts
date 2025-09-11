/**
 * Storage-related types for EveryTriv
 * Shared between client and server
 *
 * @module StorageTypes
 * @description Storage interfaces and data structures
 */

import { BasicValue } from "../core";

/**
 * Unified storage service interface
 * @interface UnifiedStorageService
 * @description Unified interface for both persistent storage and caching
 * @used_by shared/services/storage.service.ts (BaseStorageService), server/src/shared/modules/storage/storage.service.ts (ServerStorageService), client/src/services/storage/storage.service.ts (ClientStorageService)
 */
export interface UnifiedStorageService {
	/** Store value with optional TTL */
	set<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	/** Retrieve value by key */
	get<T>(key: string): Promise<StorageOperationResult<T | null>>;
	/** Remove value by key */
	delete(key: string): Promise<StorageOperationResult<void>>;
	/** Check if key exists */
	exists(key: string): Promise<StorageOperationResult<boolean>>;
	/** Clear all stored data */
	clear(): Promise<StorageOperationResult<void>>;
	/** Get all storage keys */
	getKeys(): Promise<StorageOperationResult<string[]>>;
	/** Get storage statistics */
	getStats(): Promise<StorageOperationResult<StorageStats>>;
	/** Clean up storage */
	cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>>;
	/** Invalidate keys matching pattern (cache-specific) */
	invalidate(pattern: string): Promise<StorageOperationResult<void>>;
	/** Get or set value with factory function (cache-specific) */
	getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Storage configuration interface
 * @interface StorageConfig
 * @description Configuration settings for storage services
 * @used_by shared/services/storage.service.ts (BaseStorageService), server/src/shared/modules/storage/storage.service.ts (ServerStorageService)
 */
export interface StorageConfig {
	/** Storage prefix for key namespacing */
	prefix: string;
	/** Default TTL in seconds */
	defaultTtl?: number;
	/** Whether to enable compression */
	enableCompression?: boolean;
	/** Maximum storage size in bytes */
	maxSize?: number;
	/** Storage type */
	type: 'persistent' | 'cache' | 'hybrid';
	/** Whether to enable metrics */
	enableMetrics?: boolean;
	/** Whether to enable sync */
	enableSync?: boolean;
}

/**
 * Storage operation result interface
 * @interface StorageOperationResult
 * @description Result of storage operations
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageOperationResult<T = StorageItemMetadata> {
	/** Whether operation was successful */
	success: boolean;
	/** Operation result data */
	data?: T;
	/** Error message if failed */
	error?: string;
	/** Operation timestamp */
	timestamp: Date;
	/** Operation duration in milliseconds */
	duration?: number;
	/** Storage type used */
	storageType?: 'persistent' | 'cache' | 'hybrid';
}

/**
 * Storage item metadata interface
 * @interface StorageItemMetadata
 * @description Metadata for stored items
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageItemMetadata {
	/** Item creation timestamp */
	created_at: Date;
	/** Item last update timestamp */
	updated_at: Date;
	/** Item last access timestamp */
	lastAccessed: Date;
	/** Item size in bytes */
	size: number;
	/** Item TTL in seconds */
	ttl?: number;
	/** Whether item is expired */
	isExpired: boolean;
	/** Storage type */
	storageType: 'persistent' | 'cache' | 'hybrid';
	/** Access count */
	accessCount: number;
	/** Version number for tracking changes */
	version?: string;
	/** Source information */
	source?: string;
	/** Tags for categorization */
	tags?: string[];
	/** Custom fields for additional data */
	customFields?: Record<string, BasicValue>;
	/** Cache information */
	cacheHit?: boolean;
	cacheExpiry?: Date;
	/** Performance metrics */
	accessTime?: number;
	writeTime?: number;
}

/**
 * Storage statistics interface
 * @interface StorageStats
 * @description Storage service statistics
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageStats {
	/** Total number of stored items */
	totalItems: number;
	/** Total storage size in bytes */
	totalSize: number;
	/** Number of expired items */
	expiredItems: number;
	/** Cache hit rate percentage */
	hitRate: number;
	/** Average item size in bytes */
	averageItemSize: number;
	/** Storage utilization percentage */
	utilization: number;
	/** Operations per second */
	opsPerSecond: number;
	/** Average response time in milliseconds */
	avgResponseTime: number;
	/** Storage type breakdown */
	typeBreakdown: {
		persistent: { items: number; size: number };
		cache: { items: number; size: number };
		hybrid: { items: number; size: number };
	};
}

/**
 * Storage cleanup options interface
 * @interface StorageCleanupOptions
 * @description Options for storage cleanup operations
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageCleanupOptions {
	/** Whether to remove expired items */
	removeExpired?: boolean;
	/** Whether to remove items older than specified age */
	maxAge?: number;
	/** Whether to remove items exceeding size limit */
	maxSize?: number;
	/** Whether to perform dry run */
	dryRun?: boolean;
	/** Storage types to clean */
	types?: ('persistent' | 'cache' | 'hybrid')[];
}

/**
 * Storage migration options interface
 * @interface StorageMigrationOptions
 * @description Options for storage migration operations
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageMigrationOptions {
	/** Source storage configuration */
	source: StorageConfig;
	/** Target storage configuration */
	target: StorageConfig;
	/** Whether to preserve original data */
	preserveOriginal?: boolean;
	/** Migration batch size */
	batchSize?: number;
	/** Whether to validate migrated data */
	validate?: boolean;
}

/**
 * Storage sync options interface
 * @interface StorageSyncOptions
 * @description Options for storage synchronization
 * @used_by shared/services/storage-sync.service.ts
 */
export interface StorageSyncOptions {
	/** Whether to sync from server to client */
	syncToClient?: boolean;
	/** Whether to sync from client to server */
	syncToServer?: boolean;
	/** Sync interval in milliseconds */
	interval?: number;
	/** Keys to sync (empty for all) */
	keys?: string[];
	/** Whether to sync metadata */
	syncMetadata?: boolean;
}

/**
 * Storage metrics interface
 * @interface StorageMetrics
 * @description Unified metrics for storage operations
 * @used_by shared/services/metrics.service.ts
 */
export interface StorageMetrics {
	/** Operation counts */
	operations: {
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
	};
	/** Error counts */
	errors: {
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
	};
	/** Performance metrics */
	performance: {
		avgResponseTime: number;
		opsPerSecond: number;
		hitRate: number;
		missRate: number;
	};
	/** Storage type metrics */
	storageTypes: {
		persistent: { operations: number; errors: number; size: number };
		cache: { operations: number; errors: number; size: number };
		hybrid: { operations: number; errors: number; size: number };
	};
	/** Service uptime */
	uptime: {
		ms: number;
		seconds: number;
		minutes: number;
		hours: number;
	};
	/** Total operations */
	totalOps: number;
	/** Total errors */
	totalErrors: number;
	/** Middleware metrics */
	middleware?: {
		[middlewareName: string]: {
			requestCount: number;
			totalDuration: number;
			averageDuration: number;
			minDuration: number;
			maxDuration: number;
			errorCount: number;
			lastExecuted: Date;
		};
	};
}
