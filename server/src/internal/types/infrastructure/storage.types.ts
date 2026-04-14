import { StorageType } from '@shared/constants';
import type { BaseCacheEntry, BasicValue, StorageOperationResult, StorageValue, TypeGuard } from '@shared/types';

export interface IStorageService {
	set<T extends StorageValue>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	get(key: string): Promise<StorageOperationResult<StorageValue | null>>;
	get<T extends StorageValue>(key: string, validator: TypeGuard<T>): Promise<StorageOperationResult<T | null>>;
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
		validator: TypeGuard<T>
	): Promise<T>;
}

export interface StorageConfig {
	prefix: string;
	defaultTtl?: number;
	enableCompression?: boolean;
	maxSize?: number;
	type: StorageType;
	enableMetrics?: boolean;
	enableSync?: boolean;
}

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

export type CacheEntry = Record<string, unknown>;

export interface StorageStatsItem {
	items: number;
	size: number;
}

export type StorageStatsItemByType = Record<StorageType, StorageStatsItem>;

export interface StorageStats {
	totalItems: number;
	totalSize: number;
	itemsByType: Record<string, StorageStatsItem>;
	oldestItem?: Date;
	newestItem?: Date;
	averageSize: number;
	largestItem?: {
		key: string;
		size: number;
	};
	smallestItem?: {
		key: string;
		size: number;
	};
	expiredItems: number;
	compressionRatio?: number;
	hitRate?: number;
	missRate?: number;
	evictionCount?: number;
	accessPatterns?: Record<string, number>;
	storageType: StorageType;
	avgResponseTime?: number;
	utilization?: number;
	opsPerSecond?: number;
	typeBreakdown?: StorageStatsItemByType;
}

export interface StorageCleanupOptions {
	maxAge?: number;
	maxSize?: number;
	removeExpired?: boolean;
	dryRun?: boolean;
	types?: StorageType[];
}

export interface StorageMetrics {
	operations: {
		get: number;
		set: number;
		delete: number;
		clear: number;
		exists?: number;
		getKeys?: number;
		getKeysByRelativePattern?: number;
		invalidate?: number;
		getOrSet?: number;
		getStats?: number;
		cleanup?: number;
	};
	performance: {
		averageGetTime: number;
		averageSetTime: number;
		averageDeleteTime: number;
		avgResponseTime?: number;
		opsPerSecond?: number;
		hitRate?: number;
		missRate?: number;
	};
	errors: {
		total: number;
		byType: Record<string, number>;
		get?: number;
		set?: number;
		delete?: number;
		clear?: number;
		exists?: number;
		getKeys?: number;
		getKeysByRelativePattern?: number;
		invalidate?: number;
		getOrSet?: number;
		getStats?: number;
		cleanup?: number;
	};
	storage: {
		totalSize: number;
		totalItems: number;
	};
	storageTypes?: Record<
		StorageType,
		{
			operations: number;
			errors: number;
			size: number;
		}
	>;
	uptime?: {
		ms: number;
		seconds: number;
		minutes: number;
		hours: number;
	};
	totalOps?: number;
	totalErrors?: number;
	middleware?: Record<string, unknown>;
}
