/**
 * Redis utility functions
 *
 * @module RedisUtils
 * @description Utility functions for Redis operations
 * @used_by server/src/internal/modules/cache, server/src/internal/modules/storage
 */
import type { Redis } from 'ioredis';

/**
 * Scan Redis keys using cursor to avoid blocking
 * @param redisClient Redis client instance
 * @param pattern Pattern to match keys (e.g., 'prefix:*')
 * @param count Batch size for SCAN operation (default: 100)
 * @returns Array of matching keys
 */
export async function scanKeys(redisClient: Redis | null, pattern: string, count: number = 100): Promise<string[]> {
	if (!redisClient) return [];

	const keys: string[] = [];
	let cursor = '0';

	do {
		const [nextCursor, scannedKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', count.toString());
		cursor = nextCursor;
		keys.push(...scannedKeys);
	} while (cursor !== '0');

	return keys;
}

/**
 * Delete Redis keys by pattern using SCAN and pipeline
 * @param redisClient Redis client instance
 * @param pattern Pattern to match keys (e.g., 'prefix:*')
 * @param count Batch size for SCAN operation (default: 100)
 * @returns Number of deleted keys
 */
export async function deleteKeysByPattern(
	redisClient: Redis | null,
	pattern: string,
	count: number = 100
): Promise<number> {
	if (!redisClient) return 0;

	const keys = await scanKeys(redisClient, pattern, count);

	if (keys.length === 0) return 0;

	// Use pipeline for batch deletion
	const pipeline = redisClient.pipeline();
	for (const key of keys) {
		pipeline.del(key);
	}
	await pipeline.exec();

	return keys.length;
}
