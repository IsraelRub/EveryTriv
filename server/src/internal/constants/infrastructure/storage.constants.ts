import { StorageType, TIME_DURATIONS_SECONDS } from '@shared/constants';

export const SERVER_STORAGE_CONFIG = {
	prefix: 'everytriv_',
	defaultTtl: TIME_DURATIONS_SECONDS.HOUR,
	maxSize: 5 * 1024 * 1024, // 5MB
	enableCompression: false,
	enableMetrics: true,
	enableSync: true,
	type: StorageType.PERSISTENT,
} as const;

export const CACHE_CONFIG = {
	prefix: 'everytriv_cache_',
	defaultTtl: TIME_DURATIONS_SECONDS.HOUR,
	maxSize: 100 * 1024 * 1024, // 100MB for cache
	enableCompression: false,
	enableMetrics: true,
	enableSync: false,
	type: StorageType.CACHE,
} as const;

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
