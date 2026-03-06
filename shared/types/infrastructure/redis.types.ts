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
