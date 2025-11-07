/**
 * Redis Types for EveryTriv
 * Shared between client and server
 *
 * @module RedisTypes
 * @description Redis cache, client, and configuration type definitions
 * @used_by server/src/internal/modules/cache
 */
import type { LogMeta } from './logging.types';

/**
 * Redis configuration interface
 * @interface RedisConfig
 * @description Redis connection and configuration options
 */
export interface RedisConfig {
	host: string;
	port: number;
	password?: string;
	db?: number;
	keyPrefix?: string;
	retryDelayOnFailover?: number;
	maxRetriesPerRequest?: number;
	enableReadyCheck?: boolean;
	maxMemoryPolicy?: string;
	ttl?: number;
}

/**
 * Redis cache entry interface
 * @interface RedisCacheEntry
 * @description Structure for cached data entries
 */

/**
 * Redis statistics interface
 * @interface RedisStats
 * @description Redis performance and usage statistics
 */
export interface RedisStats {
	totalKeys: number;
	memoryUsage: number;
	hitRate: number;
	missRate: number;
	operationsPerSecond: number;
	connectedClients: number;
	uptime: number;
	lastSave: Date;
	usedMemory: string;
	usedMemoryPeak: string;
	usedMemoryRss: string;
	fragmentationRatio: number;
	keyspaceHits: number;
	keyspaceMisses: number;
	expiredKeys: number;
	evictedKeys: number;
}

/**
 * Redis logger interface
 * @interface RedisLogger
 * @description Redis logging operations
 */
export interface RedisLogger {
	log(level: string, message: string, data?: LogMeta): void;
	error(message: string, error?: Error, data?: LogMeta): void;
	warn(message: string, data?: LogMeta): void;
	info(message: string, data?: LogMeta): void;
	debug(message: string, data?: LogMeta): void;
}
