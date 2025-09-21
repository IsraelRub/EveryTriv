/**
 * Storage-related types for EveryTriv
 * Shared between client and server
 *
 * @module StorageTypes
 * @description Storage interfaces and data structures
 */
import { BasicValue } from '../core';

/**
 * storage service interface
 * @interface StorageService
 * @description interface for both persistent storage and caching
 * @used_by client/src/services/storage/storage.service.ts
 */
export interface StorageService {
	set<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	get<T>(key: string): Promise<StorageOperationResult<T | null>>;
	delete(key: string): Promise<StorageOperationResult<void>>;
	exists(key: string): Promise<StorageOperationResult<boolean>>;
	clear(): Promise<StorageOperationResult<void>>;
	getKeys(): Promise<StorageOperationResult<string[]>>;
	getStats(): Promise<StorageOperationResult<StorageStats>>;
	cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>>;
	invalidate(pattern: string): Promise<StorageOperationResult<void>>;
	getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Storage configuration interface
 * @interface StorageConfig
 * @description Configuration settings for storage services
 * @used_by shared/services/storage.service.ts (BaseStorageService), server/src/shared/modules/storage/storage.service.ts (ServerStorageService)
 */
export interface StorageConfig {
	prefix: string;
	defaultTtl?: number;
	enableCompression?: boolean;
	maxSize?: number;
	type: 'persistent' | 'cache' | 'hybrid';
	enableMetrics?: boolean;
	enableSync?: boolean;
}

/**
 * Storage operation result interface
 * @interface StorageOperationResult
 * @description Result of storage operations
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageOperationResult<T = StorageItemMetadata> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: Date;
	duration?: number;
	storageType?: 'persistent' | 'cache' | 'hybrid';
}

/**
 * Storage item metadata interface
 * @interface StorageItemMetadata
 * @description Metadata for stored items
 * @used_by shared/services/storage.service.ts (BaseStorageService)
 */
export interface StorageItemMetadata {
	created_at: Date;
	updated_at: Date;
	lastAccessed: Date;
	size: number;
	ttl?: number;
	isExpired: boolean;
	storageType: 'persistent' | 'cache' | 'hybrid';
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

/**
 * Storage statistics interface
 * @interface StorageStats
 * @description Storage service statistics
 * @used_by shared/services/storage.service.ts (BaseStorageService)
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
	removeExpired?: boolean;
	maxAge?: number;
	maxSize?: number;
	dryRun?: boolean;
	types?: ('persistent' | 'cache' | 'hybrid')[];
}

/**
 * Storage migration options interface
 * @interface StorageMigrationOptions
 * @description Options for storage migration operations
 * @used_by shared/services/storage.service.ts (BaseStorageService)
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
 * @used_by shared/services/storage-sync.service.ts
 */
export interface StorageSyncOptions {
	syncToClient?: boolean;
	syncToServer?: boolean;
	interval?: number;
	keys?: string[];
	syncMetadata?: boolean;
}

/**
 * Storage metrics interface
 * @interface StorageMetrics
 * @description metrics for storage operations
 * @used_by shared/services/metrics.service.ts
 */
export interface StorageMetrics {
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
	performance: {
		avgResponseTime: number;
		opsPerSecond: number;
		hitRate: number;
		missRate: number;
	};
	storageTypes: {
		persistent: { operations: number; errors: number; size: number };
		cache: { operations: number; errors: number; size: number };
		hybrid: { operations: number; errors: number; size: number };
	};
	uptime: {
		ms: number;
		seconds: number;
		minutes: number;
		hours: number;
	};
	totalOps: number;
	totalErrors: number;
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
