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
