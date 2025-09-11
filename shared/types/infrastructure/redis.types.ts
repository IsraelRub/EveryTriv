/**
 * Redis Types for EveryTriv
 * Shared between client and server
 *
 * @module RedisTypes
 * @description Redis cache, client, and configuration type definitions
 * @used_by server: server/src/internal/modules/cache, client: client/src/services/cache
 */

import type { Redis as IORedis } from 'ioredis';
import type { StorageValue } from '../core/data.types';

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
export interface RedisCacheEntry {
	key: string;
	value: StorageValue;
	ttl?: number;
	createdAt: Date;
	expiresAt?: Date;
}

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
 * Redis client type - alias for ioredis Redis
 * @type RedisClient
 * @description Redis client type that matches ioredis Redis class
 */
export type RedisClient = IORedis;

/**
 * Redis logger interface
 * @interface RedisLogger
 * @description Redis logging operations
 */
export interface RedisLogger {
	log(level: string, message: string, data?: Record<string, unknown>): void;
	error(message: string, error?: Error, data?: Record<string, unknown>): void;
	warn(message: string, data?: Record<string, unknown>): void;
	info(message: string, data?: Record<string, unknown>): void;
	debug(message: string, data?: Record<string, unknown>): void;
}
