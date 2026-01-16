import type { Redis } from 'ioredis';

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

export async function deleteKeysByPattern(
	redisClient: Redis | null,
	pattern: string,
	count: number = 100
): Promise<number> {
	if (!redisClient) return 0;

	const keys = await scanKeys(redisClient, pattern, count);

	if (keys.length === 0) return 0;

	const pipeline = redisClient.pipeline();
	for (const key of keys) {
		pipeline.del(key);
	}
	await pipeline.exec();

	return keys.length;
}
