/**
 * Server Infrastructure Storage Constants
 * @module ServerInfrastructureStorageConstants
 * @description Server-side storage constants
 */

import { CACHE_TTL, StorageType } from '@shared/constants';

/**
 * Storage configuration (server-only)
 * @constant
 * @description Storage configuration for server-side storage operations
 */
export const STORAGE_CONFIG = {
	prefix: 'everytriv_',
	defaultTtl: 3600, // 1 hour
	maxSize: 5 * 1024 * 1024, // 5MB
	enableCompression: false,
	enableMetrics: true,
	enableSync: true,
	type: StorageType.PERSISTENT,
} as const;

/**
 * Cache configuration (server-only)
 * @constant
 * @description Cache configuration for server-side cache operations
 */

export const CACHE_CONFIG = {
	prefix: 'everytriv_cache_',
	defaultTtl: CACHE_TTL.VERY_LONG,
	maxSize: 100 * 1024 * 1024, // 100MB for cache
	enableCompression: false,
	enableMetrics: true,
	enableSync: false,
	type: StorageType.CACHE,
} as const;

/**
 * Storage operation types enum (server-only)
 * @enum StorageOperation
 * @description All available storage and cache operations
 */
export enum StorageOperation {
	SET = 'set',
	GET = 'get',
	DELETE = 'delete',
	EXISTS = 'exists',
	CLEAR = 'clear',
	GET_KEYS = 'getKeys',
	INVALIDATE = 'invalidate',
	GET_OR_SET = 'getOrSet',
	GET_STATS = 'getStats',
	CLEANUP = 'cleanup',
	MGET = 'mget',
	MSET = 'mset',
	INCREMENT = 'increment',
	SET_TTL = 'setTTL',
	GET_TTL = 'getTTL',
	INVALIDATE_PATTERN = 'invalidatePattern',
	INVALIDATE_ON_STORAGE_CHANGE = 'invalidateOnStorageChange',
}
