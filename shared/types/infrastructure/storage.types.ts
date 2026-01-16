// Storage-related types for EveryTriv.
import { StorageType } from '@shared/constants';

import { BaseCacheEntry, BasicValue, StorageValue, TypeGuard } from '../core/data.types';

export interface StorageService {
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
	setItem?<T extends StorageValue>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>>;
	getItem?<T extends StorageValue>(key: string, validator: TypeGuard<T>): Promise<StorageOperationResult<T | null>>;
	removeItem?(key: string): Promise<StorageOperationResult<void>>;
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

export interface StorageOperationResult<T = StorageItemMetadata> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: Date;
	duration?: number;
	storageType?: StorageType;
}

export interface StorageStatsResult {
	persistent: StorageStats | null;
	cache: StorageStats | null;
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
	typeBreakdown?: Record<StorageType, { items: number; size: number }>;
}

export interface StorageCleanupOptions {
	maxAge?: number;
	maxSize?: number;
	excludePatterns?: string[];
	includeExpired?: boolean;
	force?: boolean;
	removeExpired?: boolean;
	dryRun?: boolean;
	types?: StorageType[];
}

export interface StorageMigrationOptions {
	sourceType: StorageType;
	targetType: StorageType;
	keys?: string[];
	patterns?: string[];
	validate?: boolean;
	backup?: boolean;
}

export interface StorageSyncOptions {
	keys?: string[];
	patterns?: string[];
	userId?: string;
	force?: boolean;
	validate?: boolean;
	timeout?: number;
	retry?: {
		maxRetries?: number;
		delay?: number;
	};
	onProgress?: (progress: StorageSyncProgress) => void;
	onError?: (error: Error) => void;
	onComplete?: (result: StorageSyncResult) => void;
}

export interface StorageSyncProgress {
	current: number;
	total: number;
	percentage: number;
	currentKey?: string;
	status: 'syncing' | 'validating' | 'completed' | 'error';
}

export interface StorageSyncResult {
	success: boolean;
	synced: number;
	failed: number;
	errors?: string[];
	duration: number;
}

export interface StorageMetrics {
	operations: {
		get: number;
		set: number;
		delete: number;
		clear: number;
		exists?: number;
		getKeys?: number;
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
		invalidate?: number;
		getOrSet?: number;
		getStats?: number;
		cleanup?: number;
	};
	storage: {
		totalSize: number;
		itemCount: number;
		hitRate: number;
		missRate: number;
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
