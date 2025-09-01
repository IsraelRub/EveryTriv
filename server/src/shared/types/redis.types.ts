/**
 * Redis-related types for the server
 */
import type { GenericDataValue } from 'everytriv-shared/types';

// Redis configuration interface
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

// Redis logger interface
export interface RedisLogger {
	name: string;
	level: 'debug' | 'info' | 'warn' | 'error';
	enabled: boolean;
	log(level: string, message: string, meta?: Record<string, unknown>): void;
	debug(message: string, meta?: Record<string, unknown>): void;
	info(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
	error(message: string, meta?: Record<string, unknown>): void;
}

// Redis client interface
export interface RedisClient {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttl?: number): Promise<'OK'>;
	setex(key: string, ttl: number, value: string): Promise<'OK'>;
	del(key: string): Promise<number>;
	exists(key: string): Promise<number>;
	expire(key: string, seconds: number): Promise<number>;
	ttl(key: string): Promise<number>;
	keys(pattern: string): Promise<string[]>;
	mget(keys: string[]): Promise<(string | null)[]>;
	mset(keyValues: Array<{ key: string; value: GenericDataValue }>): Promise<'OK'>;
	hget(key: string, field: string): Promise<string | null>;
	hset(key: string, field: string, value: string): Promise<number>;
	hgetall(key: string): Promise<Record<string, string>>;
	hdel(key: string, field: string): Promise<number>;
	lpush(key: string, value: string): Promise<number>;
	rpop(key: string): Promise<string | null>;
	llen(key: string): Promise<number>;
	zadd(key: string, score: number, member: string): Promise<number>;
	zrange(key: string, start: number, stop: number): Promise<string[]>;
	zscore(key: string, member: string): Promise<number | null>;
	publish(channel: string, message: string): Promise<number>;
	subscribe(channel: string, callback: (message: string) => void): Promise<void>;
	ping(): Promise<'PONG'>;
	flushdb(): Promise<'OK'>;
	info(section?: string): Promise<string>;
	pipeline(): RedisPipeline;
	expire(key: string, seconds: number): Promise<number>;
	ttl(key: string): Promise<number>;
	mget(keys: string[]): Promise<(string | null)[]>;

	// Event listeners
	on(event: 'connect', listener: () => void): this;
	on(event: 'ready', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
	on(event: 'reconnecting', listener: (delay: number) => void): this;
	on(event: 'end', listener: () => void): this;
	on(event: string, listener: (...args: GenericDataValue[]) => void): this;

	// Configuration options
	options: {
		host: string;
		port: number;
		password?: string;
		db?: number;
	};
}

// Redis cache entry interface
export interface RedisCacheEntry<T = RedisStats> {
	key: string;
	value: T;
	ttl: number;
	created_at: Date;
	expiresAt: Date;
}

// Redis pipeline interface
export interface RedisPipeline {
	exec(): Promise<unknown[]>;
	get(key: string): RedisPipeline;
	set(key: string, value: string, ttl?: number): RedisPipeline;
	del(key: string): RedisPipeline;
	expire(key: string, seconds: number): RedisPipeline;
	hget(key: string, field: string): RedisPipeline;
	hset(key: string, field: string, value: string): RedisPipeline;
	hdel(key: string, field: string): RedisPipeline;
}

// Redis statistics interface
export interface RedisStats {
	connectedClients: number;
	usedMemory: number;
	totalCommandsProcessed: number;
	keyspaceHits: number;
	keyspaceMisses: number;
	hitRate: number;
	uptime: number;
	lastSaveTime: Date;
}
